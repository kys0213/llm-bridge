import { SDK } from 'llm-bridge-spec';
import { GoogleAIBridge } from './bridge/google-bridge';
import { createGoogleAIBridge } from './bridge/google-factory';
import { GOOGLE_MANIFEST } from './bridge/google-manifest';

export default SDK.createBridgePackage({
  bridge: GoogleAIBridge,
  factory: createGoogleAIBridge,
  manifest: GOOGLE_MANIFEST,
});

export type { GoogleAIConfig } from './bridge/google-config';
export { GoogleModelEnum } from './bridge/google-models';
