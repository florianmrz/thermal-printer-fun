#include "print_client.h"
#include <Arduino.h>
#include "usb/usb_host.h"

// Global client handle
usb_host_client_handle_t client_hdl;
usb_device_handle_t dev_hdl = NULL;
uint8_t printer_address = 0;
uint8_t ep_out = 0;
uint8_t ep_in = 0;

// How long a single chunk may take before the printer is considered stuck. A busy printer stops
// accepting data once its input buffer fills, so this has to tolerate waiting for it to catch up.
static const unsigned long usbTransferTimeoutMs = 5000;

// One transfer is allocated up front and reused for every chunk of every job, so the memory needed
// to print never depends on the size of a job.
static usb_transfer_t *sharedTransfer = NULL;

// Set by the completion callback, which runs on this task from inside usb_host_client_handle_events.
static volatile bool transferCompleted = false;

static void transfer_callback(usb_transfer_t *transfer)
{
  transferCompleted = true;
}

static void usb_lib_task(void *arg)
{
  while (1)
  {
    uint32_t event_flags;
    usb_host_lib_handle_events(portMAX_DELAY, &event_flags);
  }
}

static bool ensureSharedTransfer()
{
  if (sharedTransfer != NULL)
  {
    return true;
  }

  if (usb_host_transfer_alloc(usbChunkBytes, 0, &sharedTransfer) != ESP_OK)
  {
    Serial.println("✗ Transfer alloc failed");
    sharedTransfer = NULL;
    return false;
  }

  return true;
}

/**
 * Brings the out endpoint back to a usable state after a chunk timed out. Flushing completes the
 * transfer that is still queued, which is what makes the shared buffer safe to touch again.
 */
static void recoverStalledEndpoint()
{
  if (dev_hdl == NULL || ep_out == 0)
  {
    return;
  }

  usb_host_endpoint_halt(dev_hdl, ep_out);
  usb_host_endpoint_flush(dev_hdl, ep_out);
  usb_host_endpoint_clear(dev_hdl, ep_out);

  // Dispatch the callback of the flushed transfer before anybody reuses the buffer.
  unsigned long start = millis();
  while (!transferCompleted && millis() - start < 500)
  {
    usb_host_client_handle_events(client_hdl, pdMS_TO_TICKS(10));
  }

  if (!transferCompleted)
  {
    // The transfer is still owned by the host stack, so the buffer can never be reused safely.
    // Leaking it costs one chunk worth of memory and is preferable to corrupting the heap.
    Serial.println("✗ Stalled transfer did not complete, dropping its buffer");
    sharedTransfer = NULL;
  }
}

bool printChunk(const uint8_t *data, size_t length)
{
  if (dev_hdl == NULL || ep_out == 0)
  {
    Serial.println("Device not ready");
    return false;
  }

  if (length == 0)
  {
    return true;
  }

  if (length > usbChunkBytes)
  {
    Serial.printf("✗ Chunk of %u bytes exceeds the transfer size of %u bytes\n", length, usbChunkBytes);
    return false;
  }

  if (!ensureSharedTransfer())
  {
    return false;
  }

  transferCompleted = false;

  sharedTransfer->device_handle = dev_hdl;
  sharedTransfer->bEndpointAddress = ep_out;
  sharedTransfer->callback = transfer_callback;
  sharedTransfer->context = NULL;
  sharedTransfer->num_bytes = length;
  sharedTransfer->timeout_ms = usbTransferTimeoutMs;
  memcpy(sharedTransfer->data_buffer, data, length);

  if (usb_host_transfer_submit(sharedTransfer) != ESP_OK)
  {
    Serial.println("✗ Transfer submit failed");
    return false;
  }

  unsigned long start = millis();
  while (!transferCompleted && millis() - start < usbTransferTimeoutMs)
  {
    usb_host_client_handle_events(client_hdl, pdMS_TO_TICKS(10));
  }

  if (!transferCompleted)
  {
    Serial.println("✗ Transfer timed out");
    recoverStalledEndpoint();
    return false;
  }

  if (sharedTransfer->status != USB_TRANSFER_STATUS_COMPLETED)
  {
    Serial.printf("✗ Transfer failed (status=%d)\n", sharedTransfer->status);
    return false;
  }

  if ((size_t)sharedTransfer->actual_num_bytes != length)
  {
    Serial.printf("✗ Sent %d/%u bytes\n", sharedTransfer->actual_num_bytes, length);
    return false;
  }

  return true;
}

void printCut()
{
  if (!isPrinterConnected())
  {
    return;
  }

  // ESC FF NUL
  const uint8_t cutCommand[] = {0x1b, 0x0c, 0x00};
  printChunk(cutCommand, sizeof(cutCommand));
}

static void client_event_callback(const usb_host_client_event_msg_t *event_msg, void *arg)
{
  if (event_msg->event == USB_HOST_CLIENT_EVENT_NEW_DEV)
  {
    Serial.printf("\n✓ USB Device Connected (address %d)\n", event_msg->new_dev.address);

    usb_device_handle_t temp_dev_hdl;
    if (usb_host_device_open(client_hdl, event_msg->new_dev.address, &temp_dev_hdl) == ESP_OK)
    {
      const usb_device_desc_t *dev_desc;
      if (usb_host_get_device_descriptor(temp_dev_hdl, &dev_desc) == ESP_OK)
      {
        Serial.printf("VID:PID = 0x%04X:0x%04X\n", dev_desc->idVendor, dev_desc->idProduct);

        // Star Micronics (0x0519) or Printer Class (0x07)
        if (dev_desc->idVendor == 0x0519 || dev_desc->bDeviceClass == 0x07)
        {
          Serial.println("★ PRINTER DETECTED\n");
          printer_address = event_msg->new_dev.address;
          dev_hdl = temp_dev_hdl;

          // Claim interface
          if (usb_host_interface_claim(client_hdl, dev_hdl, 0, 0) == ESP_OK)
          {
            Serial.println("✓ Interface claimed");

            // Find endpoints
            const usb_config_desc_t *config_desc;
            usb_host_get_active_config_descriptor(dev_hdl, &config_desc);

            int offset = 0;
            const usb_intf_desc_t *intf_desc = usb_parse_interface_descriptor(config_desc, 0, 0, &offset);

            ep_out = 0;
            ep_in = 0;
            if (intf_desc)
            {
              for (int i = 0; i < intf_desc->bNumEndpoints; i++)
              {
                int ep_offset = offset;
                const usb_ep_desc_t *ep = usb_parse_endpoint_descriptor_by_index(intf_desc, i, config_desc->wTotalLength, &ep_offset);
                if (ep && (ep->bmAttributes & 0x03) == 0x02)
                { // Bulk endpoint
                  if (ep->bEndpointAddress & 0x80)
                  {
                    ep_in = ep->bEndpointAddress;
                  }
                  else
                  {
                    ep_out = ep->bEndpointAddress;
                  }
                }
              }
            }

            Serial.printf("✓ Endpoints: OUT=0x%02X, IN=0x%02X\n", ep_out, ep_in);
          }
          else
          {
            Serial.println("✗ Failed to claim interface");
            usb_host_device_close(client_hdl, dev_hdl);
            dev_hdl = NULL;
            printer_address = 0;
          }
        }
        else
        {
          usb_host_device_close(client_hdl, temp_dev_hdl);
        }
      }
      else
      {
        usb_host_device_close(client_hdl, temp_dev_hdl);
      }
    }
  }
  else if (event_msg->event == USB_HOST_CLIENT_EVENT_DEV_GONE)
  {
    Serial.println("✗ USB Device Disconnected\n");

    if (dev_hdl != NULL)
    {
      usb_host_interface_release(client_hdl, dev_hdl, 0);
      usb_host_device_close(client_hdl, dev_hdl);
      dev_hdl = NULL;
    }

    printer_address = 0;
    ep_out = 0;
    ep_in = 0;
  }
}

void printClientSetup()
{
  // Install USB Host
  const usb_host_config_t host_config = {
      .skip_phy_setup = false,
      .intr_flags = ESP_INTR_FLAG_LEVEL1,
  };
  usb_host_install(&host_config);

  // Create USB event task
  xTaskCreate(usb_lib_task, "usb_lib", 4096, NULL, 10, NULL);

  // Register client
  const usb_host_client_config_t client_config = {
      .is_synchronous = false,
      .max_num_event_msg = 5,
      .async = {
          .client_event_callback = client_event_callback,
          .callback_arg = NULL}};
  usb_host_client_register(&client_config, &client_hdl);

  // Reserve the transfer buffer while the heap is still unfragmented.
  ensureSharedTransfer();
}

void printClientLoop()
{
  usb_host_client_handle_events(client_hdl, 0);
}

bool isPrinterConnected()
{
  return dev_hdl != NULL;
}
