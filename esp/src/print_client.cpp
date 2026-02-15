#include "print_client.h"
#include <Arduino.h>
#include "usb/usb_host.h"
#include <freertos/semphr.h>

// Global client handle
usb_host_client_handle_t client_hdl;
usb_device_handle_t dev_hdl = NULL;
uint8_t printer_address = 0;
uint8_t ep_out = 0;
uint8_t ep_in = 0;

// Transfer completion tracking
typedef struct
{
  SemaphoreHandle_t done_sem;
  bool completed;
} transfer_context_t;

static void transfer_callback(usb_transfer_t *transfer)
{
  transfer_context_t *ctx = (transfer_context_t *)transfer->context;
  if (ctx)
  {
    ctx->completed = true;
    xSemaphoreGive(ctx->done_sem);
  }
}

static void usb_lib_task(void *arg)
{
  while (1)
  {
    uint32_t event_flags;
    usb_host_lib_handle_events(portMAX_DELAY, &event_flags);
  }
}

// Send data to printer
void print(const std::vector<uint8_t> &printData)
{
  if (dev_hdl == NULL || ep_out == 0)
  {
    Serial.println("Device not ready");
    return;
  }

  const uint8_t *data = printData.data();
  size_t len = printData.size();

  // Serial.println();
  // Serial.printf("Data: (%d bytes)", len);
  // Serial.println();
  // for (int i = 0; i < len; i++)
  // {
  //   Serial.printf("%02X ", data[i]);
  // }
  // Serial.println();

  usb_transfer_t *transfer;
  if (usb_host_transfer_alloc(len, 0, &transfer) != ESP_OK)
  {
    Serial.println("✗ Transfer alloc failed");
    return;
  }

  transfer_context_t ctx = {
      .done_sem = xSemaphoreCreateBinary(),
      .completed = false};

  transfer->device_handle = dev_hdl;
  transfer->bEndpointAddress = ep_out;
  transfer->callback = transfer_callback;
  transfer->context = &ctx;
  transfer->num_bytes = len;
  transfer->timeout_ms = 2000;
  memcpy(transfer->data_buffer, data, len);

  if (usb_host_transfer_submit(transfer) != ESP_OK)
  {
    Serial.println("✗ Transfer submit failed");
    vSemaphoreDelete(ctx.done_sem);
    usb_host_transfer_free(transfer);
    return;
  }

  // Wait for transfer callback
  unsigned long start = millis();
  while (!ctx.completed && millis() - start < 2500)
  {
    usb_host_client_handle_events(client_hdl, 10);
    if (xSemaphoreTake(ctx.done_sem, 0) == pdTRUE)
    {
      break;
    }
  }

  bool success = (transfer->actual_num_bytes > 0);
  // Serial.printf("%s Sent %d/%d bytes (status=%d)\n",
  //               success ? "✓" : "✗",
  //               transfer->actual_num_bytes, len, transfer->status);

  vSemaphoreDelete(ctx.done_sem);

  usb_host_transfer_free(transfer);

  usb_host_client_handle_events(client_hdl, 100);
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
}

void printClientLoop()
{
  usb_host_client_handle_events(client_hdl, 0);
}

void triggerPrint(const std::vector<uint8_t> &printData)
{
  if (printer_address != 0 && dev_hdl != NULL)
  {
    print(printData);
  }
  else
  {
    Serial.println("✗ No printer connected");
  }
}
