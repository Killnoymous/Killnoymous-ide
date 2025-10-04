export class SerialUploader {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private writer: WritableStreamDefaultWriter | null = null;

  async connect(): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser');
      }

      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 115200 });

      this.reader = this.port.readable?.getReader() || null;
      this.writer = this.port.writable?.getWriter() || null;

      return true;
    } catch (error) {
      console.error('Failed to connect to serial port:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }

      if (this.writer) {
        await this.writer.close();
        this.writer.releaseLock();
        this.writer = null;
      }

      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  async upload(code: string, onProgress?: (message: string) => void): Promise<boolean> {
    try {
      if (!this.port || !this.writer) {
        throw new Error('Not connected to Arduino');
      }

      onProgress?.('Uploading sketch to Arduino...');

      const encoder = new TextEncoder();
      const data = encoder.encode(code);

      await this.writer.write(data);

      onProgress?.('Upload complete!');
      return true;
    } catch (error) {
      console.error('Upload failed:', error);
      onProgress?.(`Upload failed: ${error}`);
      return false;
    }
  }

  isConnected(): boolean {
    return this.port !== null;
  }

  async readData(): Promise<string> {
    if (!this.reader) {
      throw new Error('Not connected');
    }

    const { value, done } = await this.reader.read();
    if (done) {
      return '';
    }

    const decoder = new TextDecoder();
    return decoder.decode(value);
  }
}
