import { DataProviderConfig, RawRecordPayload } from "../types";

export abstract class BaseProvider {
  public config: DataProviderConfig;

  constructor(config: DataProviderConfig) {
    this.config = config;
  }

  abstract fetchRawRecords(limit?: number): Promise<RawRecordPayload[]>;

  public isEnabled(): boolean {
    return this.config.enabled;
  }
}
