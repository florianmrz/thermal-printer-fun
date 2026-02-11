#include <Arduino.h>
#include "usb/usb_host.h"
#include <freertos/semphr.h>

// Global client handle
usb_host_client_handle_t client_hdl;
uint8_t printer_address = 0;

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
bool send_to_printer(usb_device_handle_t dev_hdl, uint8_t endpoint_out, uint8_t endpoint_in, const uint8_t *data, size_t len)
{
  Serial.println();
  Serial.printf("Data: (%d bytes)", len);
  Serial.println();
  for (int i = 0; i < len; i++)
  {
    Serial.printf("%02X ", data[i]);
  }
  Serial.println();

  usb_transfer_t *transfer;
  if (usb_host_transfer_alloc(len, 0, &transfer) != ESP_OK)
  {
    Serial.println("✗ Transfer alloc failed");
    return false;
  }

  transfer_context_t ctx = {
      .done_sem = xSemaphoreCreateBinary(),
      .completed = false};

  transfer->device_handle = dev_hdl;
  transfer->bEndpointAddress = endpoint_out;
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
    return false;
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
  Serial.printf("%s Sent %d/%d bytes (status=%d)\n",
                success ? "✓" : "✗",
                transfer->actual_num_bytes, len, transfer->status);

  vSemaphoreDelete(ctx.done_sem);

  usb_host_transfer_free(transfer);

  return success;
}

// Try different ESC/POS command variations
void try_print_variations(uint8_t dev_addr)
{
  usb_device_handle_t dev_hdl;
  if (usb_host_device_open(client_hdl, dev_addr, &dev_hdl) != ESP_OK)
  {
    Serial.println("Failed to open device");
    return;
  }

  // Claim interface
  if (usb_host_interface_claim(client_hdl, dev_hdl, 0, 0) != ESP_OK)
  {
    Serial.println("Failed to claim interface");
    usb_host_device_close(client_hdl, dev_hdl);
    return;
  }

  // Find endpoints
  const usb_config_desc_t *config_desc;
  usb_host_get_active_config_descriptor(dev_hdl, &config_desc);

  int offset = 0;
  const usb_intf_desc_t *intf_desc = usb_parse_interface_descriptor(config_desc, 0, 0, &offset);

  uint8_t ep_out = 0, ep_in = 0;
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

  Serial.printf("Endpoints: OUT=0x%02X, IN=0x%02X\n", ep_out, ep_in);

  if (ep_out == 0)
  {
    Serial.println("No bulk OUT endpoint found");
    usb_host_interface_release(client_hdl, dev_hdl, 0);
    usb_host_device_close(client_hdl, dev_hdl);
    return;
  }

  delay(500);

  // Set raster page length to continous mode (n = 0)
  {
    uint8_t cmd[] = {0x1B, 0x2A, 0x72, 0x50, 0x00, 0x00}; // ESC * r P n NUL (n = page length, 0 for continous print)
    send_to_printer(dev_hdl, ep_out, ep_in, cmd, sizeof(cmd));
  }

  // Set raster print quality
  // TODO does this actually makes a difference?
  {
    uint8_t cmd[] = {0x1B, 0x2A, 0x72, 0x51, 0x00, 0x00}; // ESC * r Q n NUL (n = print quality: 0 = high speed, 1 = normal 2 = high print)
    send_to_printer(dev_hdl, ep_out, ep_in, cmd, sizeof(cmd));
  }

  // Send raster data
  {
    uint8_t cmd[1 + 3 + 72]; // b H 00 + 72 bytes of ff
    int len = 0;
    cmd[len++] = 0x62; // b
    cmd[len++] = 0x48; // H
    cmd[len++] = 0x00; // NUL
    for (int i = 0; i < 72; i++)
    {
      cmd[len++] = 0xFF; // black pixels
    }
    // TODO replace with actual data
    for (int i = 0; i < 30; i++)
    { // Send multiple lines to ensure it prints
      send_to_printer(dev_hdl, ep_out, ep_in, cmd, len);
    }
  }

  // Move vertical direction position by 30
  // {
  //   uint8_t cmd[] = {0x1B, 0x2A, 0x72, 0x59, 0x1e, 0x00};
  //   send_to_printer(dev_hdl, ep_out, ep_in, cmd, sizeof(cmd));
  // }

  // Execute FF mode (cuts paper)
  {
    uint8_t cmd[] = {0x1B, 0x0C, 0x00};
    send_to_printer(dev_hdl, ep_out, ep_in, cmd, sizeof(cmd));
  }

  // Wait to ensure all transfers are fully processed
  delay(500);
  usb_host_client_handle_events(client_hdl, 100);

  // Cleanup
  usb_host_interface_release(client_hdl, dev_hdl, 0);
  usb_host_device_close(client_hdl, dev_hdl);
}

static void client_event_callback(const usb_host_client_event_msg_t *event_msg, void *arg)
{
  if (event_msg->event == USB_HOST_CLIENT_EVENT_NEW_DEV)
  {
    Serial.printf("\n✓ USB Device Connected (address %d)\n", event_msg->new_dev.address);

    usb_device_handle_t dev_hdl;
    if (usb_host_device_open(client_hdl, event_msg->new_dev.address, &dev_hdl) == ESP_OK)
    {
      const usb_device_desc_t *dev_desc;
      if (usb_host_get_device_descriptor(dev_hdl, &dev_desc) == ESP_OK)
      {
        Serial.printf("VID:PID = 0x%04X:0x%04X\n", dev_desc->idVendor, dev_desc->idProduct);

        // Star Micronics (0x0519) or Printer Class (0x07)
        if (dev_desc->idVendor == 0x0519 || dev_desc->bDeviceClass == 0x07)
        {
          Serial.println("★ PRINTER DETECTED - Starting print job...\n");
          printer_address = event_msg->new_dev.address;
        }
      }
      usb_host_device_close(client_hdl, dev_hdl);
    }
  }
  else if (event_msg->event == USB_HOST_CLIENT_EVENT_DEV_GONE)
  {
    Serial.println("✗ USB Device Disconnected\n");
    printer_address = 0;
  }
}

void setup()
{
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=== ESP32-S3 USB Printer Test ===");

  // Install USB Host
  const usb_host_config_t host_config = {
      .skip_phy_setup = false,
      .intr_flags = ESP_INTR_FLAG_LEVEL1,
  };

  if (usb_host_install(&host_config) != ESP_OK)
  {
    Serial.println("✗ USB Host install failed");
    return;
  }

  // Create USB event task
  xTaskCreate(usb_lib_task, "usb_lib", 4096, NULL, 10, NULL);
  delay(100);

  // Register client
  const usb_host_client_config_t client_config = {
      .is_synchronous = false,
      .max_num_event_msg = 5,
      .async = {
          .client_event_callback = client_event_callback,
          .callback_arg = NULL}};

  if (usb_host_client_register(&client_config, &client_hdl) != ESP_OK)
  {
    Serial.println("✗ Client register failed");
    return;
  }

  Serial.println("✓ USB Host ready - Connect printer\n");
  delay(1000);
}

void loop()
{
  static bool test_run = false;

  usb_host_client_handle_events(client_hdl, 0);

  // Run test once when printer is detected
  if (printer_address != 0 && !test_run)
  {
    delay(1000); // Wait for printer to settle
    try_print_variations(printer_address);
    test_run = true;
  }

  // Reset test flag if printer disconnected
  if (printer_address == 0)
  {
    test_run = false;
  }

  delay(100);
}
