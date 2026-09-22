#ifndef PRINT_CLIENT_H
#define PRINT_CLIENT_H

#include <Arduino.h>

// Largest slice of a print job that is handed to the printer in one USB transfer. Jobs are streamed
// in slices of this size, so the memory needed to print does not depend on the size of the job.
// A multiple of the 64 byte full speed bulk max packet size.
const size_t usbChunkBytes = 8192;

// Initialize the USB printer client
void printClientSetup();

// Poll USB events and handle printing
void printClientLoop();

// Send one slice of a print job to the printer. Blocks until the printer has taken the data, which
// is what applies backpressure while a long job is being streamed. Returns false if the slice could
// not be delivered, in which case the rest of the job should be abandoned.
bool printChunk(const uint8_t *data, size_t length);

// Cut the paper. Used to close off a job that was aborted midway, so the next print starts on a
// fresh receipt.
void printCut();

// Check if printer is connected
bool isPrinterConnected();

#endif // PRINT_CLIENT_H
