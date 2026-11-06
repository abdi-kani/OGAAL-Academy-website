import "server-only";
import { encryptedJsonFile } from "./store";

export type AdminSettings = {
  signatoryName: string;
  signatoryTitle: string;
  signatureAsset: string | null;
  sealAsset: string | null;
  trainingTitle: string;
};

const settingsFile = encryptedJsonFile<AdminSettings>("data/settings.json.enc", {
  kind: "settings",
  message: "Update settings",
  empty: () => ({ signatoryName: "", signatoryTitle: "", signatureAsset: null, sealAsset: null, trainingTitle: "Firearms Safety Training" }),
});

export const getSettings = settingsFile.read;
export const updateSettings = settingsFile.update;
