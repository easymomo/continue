// Type definitions for the window object extensions

interface IdeMessenger {
  runVSCodeCommand: (command: string, ...args: any[]) => Promise<any>;
  // Add other IDE messenger methods as needed
}

declare global {
  interface Window {
    ideMessenger?: IdeMessenger;
    vscMediaUrl?: string;
    // Add other global variables as needed
  }
}

export {};
