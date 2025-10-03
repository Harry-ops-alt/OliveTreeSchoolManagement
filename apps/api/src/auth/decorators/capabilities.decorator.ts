import { SetMetadata } from '@nestjs/common';
import type { Capability } from '../roles.constants.js';

export const CAPABILITIES_KEY = 'capabilities';

export const Capabilities = (...capabilities: Capability[]) =>
  SetMetadata(CAPABILITIES_KEY, capabilities);
