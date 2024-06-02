import { LightningTransaction } from '../class/wallets/types';

export type DetailViewStackParamList = {
  UnlockWithScreen: undefined;
  WalletsList: undefined;
  WalletTransactions: { walletID: string; walletType: string };
  LDKOpenChannelRoot: undefined;
  LdkInfo: undefined;
  WalletDetails: { walletID: string };
  LdkViewLogs: {
    walletID: string;
  };
  TransactionDetails: { transactionId: string };
  TransactionStatus: { hash?: string; walletID?: string };
  CPFP: { transactionId: string };
  RBFBumpFee: { transactionId: string };
  RBFCancel: { transactionId: string };
  SelectWallet: undefined;
  LNDViewInvoice: { invoice: LightningTransaction; walletID: string };
  LNDViewAdditionalInvoiceInformation: { invoiceId: string };
  LNDViewAdditionalInvoicePreImage: { invoiceId: string };
  Broadcast: undefined;
  IsItMyAddress: undefined;
  GenerateWord: undefined;
  LnurlPay: undefined;
  LnurlPaySuccess: {
    paymentHash: string;
    justPaid: boolean;
    fromWalletID: string;
  };
  LnurlAuth: undefined;
  Success: undefined;
  WalletAddresses: { walletID: string };
  AddWalletRoot: undefined;
  SendDetailsRoot: undefined;
  LNDCreateInvoiceRoot: undefined;
  ScanLndInvoiceRoot: {
    screen: string;
    params: {
      paymentHash: string;
      fromWalletID: string;
      justPaid: boolean;
    };
  };
  AztecoRedeemRoot: undefined;
  WalletExportRoot: {
    screen: string;
    params: {
      walletID: string;
    };
  };
  ExportMultisigCoordinationSetupRoot: {
    screen: string;
    params: {
      walletID: string;
    };
  };
  Settings: undefined;
  Currency: undefined;
  GeneralSettings: undefined;
  PlausibleDeniability: undefined;
  Licensing: undefined;
  NetworkSettings: undefined;
  About: undefined;
  DefaultView: undefined;
  ElectrumSettings: undefined;
  EncryptStorage: undefined;
  Language: undefined;
  LightningSettings: {
    url?: string;
  };
  NotificationSettings: undefined;
  SelfTest: undefined;
  ReleaseNotes: undefined;
  Tools: undefined;
  SettingsPrivacy: undefined;
  ViewEditMultisigCosignersRoot: { 
    screen: string, 
    params: 
    { walletID: string }
  };
  WalletXpubRoot: {
    screen: string;
    params: {
      walletID: string;
    };
  };
  SignVerifyRoot: {
    screen: 'SignVerify';
    params: {
      walletID: string;
      address: string;
    };
  };
  ReceiveDetailsRoot: {
    screen: 'ReceiveDetails';
    params: {
      walletID: string;
      address: string;
    };
  };
  ScanQRCodeRoot: {
    screen: string;
    params: {
      isLoading: false;
      cameraStatusGranted?: boolean;
      backdoorPressed?: boolean;
      launchedBy?: string;
      urTotal?: number;
      urHave?: number;
      backdoorText?: string;
      onDismiss?: () => void;
      showFileImportButton: true;
      backdoorVisible?: boolean;
      animatedQRCodeData?: Record<string, any>;
    };
  };
  PaymentCodeRoot: undefined;
  ReorderWallets: undefined;
};
