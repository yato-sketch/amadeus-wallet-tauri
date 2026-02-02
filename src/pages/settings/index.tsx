import { Navigate } from "react-router-dom";

// Lib
import { SETTINGS_BASE_PATH } from "@/lib/settings";

function SettingsIndexRedirectPage() {
    return <Navigate to={`${SETTINGS_BASE_PATH}/network`} replace />;
}

export default SettingsIndexRedirectPage;
export { SettingsIndexRedirectPage };
export { default as SettingsNetworkPage } from "./NetworkPage";
export { default as SettingsPasswordPage } from "./PasswordPage";
export { default as SettingsWalletPage } from "./WalletPage";
export { default as SettingsDataPage } from "./DataPage";
export { default as SettingsAboutPage } from "./AboutPage";