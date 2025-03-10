import { useCallback, useEffect, useRef } from 'react';
import {
  transferCurrentComplicationUserInfo,
  transferUserInfo,
  updateApplicationContext,
  useInstalled,
  usePaired,
  useReachability,
  watchEvents,
} from 'react-native-watch-connectivity';
import { MultisigHDWallet } from '../class';
import loc, { formatBalance, transactionTimeToReadable } from '../loc';
import { Chain } from '../models/bitcoinUnits';
import { FiatUnit } from '../models/fiatUnit';
import { useSettings } from '../hooks/context/useSettings';
import { useStorage } from '../hooks/context/useStorage';
import { isNotificationsEnabled, majorTomToGroundControl } from '../blue_modules/notifications';

interface Message {
  request?: string;
  message?: string;
  walletIndex?: number;
  amount?: number;
  description?: string;
  hideBalance?: boolean;
}

interface Reply {
  (response: Record<string, any>): void;
}

interface LightningInvoiceCreateRequest {
  walletIndex: number;
  amount: number;
  description?: string;
}

interface Transaction {
  type: string;
  amount: string;
  memo: string;
  time: string;
}

export function useWatchConnectivity() {
  const { walletsInitialized, wallets, fetchWalletTransactions, saveToDisk, txMetadata } = useStorage();
  const { preferredFiatCurrency } = useSettings();
  const isReachable = useReachability();
  const isInstalled = useInstalled();
  const isPaired = usePaired();
  const messagesListenerActive = useRef(false);
  const lastPreferredCurrency = useRef(FiatUnit.USD.endPointKey);

  // Set up message listener only when conditions are met
  useEffect(() => {
    if (!isInstalled || !isPaired || !walletsInitialized || !isReachable) {
      console.debug('Apple Watch not installed, not paired, or other conditions not met. Exiting message listener setup.');
      return;
    }

    const messagesListener = watchEvents.addListener('message', (message: any) => handleMessages(message, () => {}));
    messagesListenerActive.current = true;

    return () => {
      messagesListener();
      messagesListenerActive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletsInitialized, isReachable, isInstalled, isPaired]);

  // Send wallet data to Apple Watch
  useEffect(() => {
    if (!isInstalled || !isPaired || !walletsInitialized) return;

    const sendWalletData = async () => {
      try {
        const walletsToProcess = await constructWalletsToSendToWatch();
        if (walletsToProcess) {
          if (isReachable) {
            transferUserInfo(walletsToProcess);
            console.debug('Apple Watch: sent info to watch transferUserInfo');
          } else {
            updateApplicationContext(walletsToProcess);
            console.debug('Apple Watch: sent info to watch context');
          }
        }
      } catch (error) {
        console.debug('Failed to send wallets to watch:', error);
      }
    };
    sendWalletData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletsInitialized, isReachable, isInstalled, isPaired]);

  // Update application context with wallet status
  useEffect(() => {
    if (!isInstalled || !isPaired || !walletsInitialized || !isReachable) return;

    updateApplicationContext({ isWalletsInitialized: walletsInitialized, randomID: Math.floor(Math.random() * 11) });
  }, [isReachable, walletsInitialized, isInstalled, isPaired]);

  // Update preferred fiat currency to Apple Watch if it changes
  useEffect(() => {
    if (!isInstalled || !isPaired || !walletsInitialized || !isReachable || !preferredFiatCurrency) return;

    if (lastPreferredCurrency.current !== preferredFiatCurrency.endPointKey) {
      try {
        transferCurrentComplicationUserInfo({ preferredFiatCurrency: preferredFiatCurrency.endPointKey });
        lastPreferredCurrency.current = preferredFiatCurrency.endPointKey;
        console.debug('Apple Watch: updated preferred fiat currency');
      } catch (error) {
        console.debug('Error updating preferredFiatCurrency on watch:', error);
      }
    } else {
      console.debug('WatchConnectivity lastPreferredCurrency has not changed');
    }
  }, [preferredFiatCurrency, walletsInitialized, isReachable, isInstalled, isPaired]);

  const handleMessages = useCallback(
    async (message: Message, reply: Reply) => {
      try {
        if (message.request === 'createInvoice') {
          const createInvoiceRequest = await handleLightningInvoiceCreateRequest({
            walletIndex: message.walletIndex!,
            amount: message.amount!,
            description: message.description,
          });
          reply({ invoicePaymentRequest: createInvoiceRequest });
        } else if (message.message === 'sendApplicationContext') {
          const walletsToProcess = await constructWalletsToSendToWatch();
          if (walletsToProcess) updateApplicationContext(walletsToProcess);
        } else if (message.message === 'fetchTransactions') {
          await fetchWalletTransactions();
          await saveToDisk();
          reply({});
        } else if (message.message === 'hideBalance') {
          wallets[message.walletIndex!].hideBalance = message.hideBalance!;
          await saveToDisk();
          reply({});
        }
      } catch (error) {
        console.debug('Error handling message:', error);
        reply({});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchWalletTransactions, saveToDisk, wallets],
  );

  const handleLightningInvoiceCreateRequest = useCallback(
    async ({ walletIndex, amount, description = loc.lnd.placeholder }: LightningInvoiceCreateRequest): Promise<string | undefined> => {
      const wallet = wallets[walletIndex];
      if (wallet.allowReceive() && amount > 0) {
        try {
          if ('addInvoice' in wallet) {
            const invoiceRequest = await wallet.addInvoice(amount, description);
            if (await isNotificationsEnabled()) {
              const decoded = await wallet.decodeInvoice(invoiceRequest);
              majorTomToGroundControl([], [decoded.payment_hash], []);
              return invoiceRequest;
            }
            return invoiceRequest;
          }
        } catch (invoiceError) {
          console.debug('Error creating invoice:', invoiceError);
        }
      }
    },
    [wallets],
  );

  // Construct wallet data to send to the watch, including transaction details
  const constructWalletsToSendToWatch = useCallback(async () => {
    if (!Array.isArray(wallets) || !walletsInitialized) return;

    const walletsToProcess = await Promise.allSettled(
      wallets.map(async wallet => {
        try {
          let receiveAddress;
          try {
            receiveAddress = wallet.chain === Chain.ONCHAIN ? await wallet.getAddressAsync() : wallet.getAddress();
          } catch {
            receiveAddress =
              wallet.chain === Chain.ONCHAIN
                ? 'next_free_address_index' in wallet && '_getExternalAddressByIndex' in wallet
                  ? wallet._getExternalAddressByIndex(wallet.next_free_address_index)
                  : wallet.getAddress()
                : wallet.getAddress();
          }

          const transactions: Transaction[] = wallet
            .getTransactions()
            .slice(0, 10)
            .map((transaction: any) => ({
              type: transaction.confirmations ? 'pendingConfirmation' : 'received',
              amount: formatBalance(transaction.value, wallet.getPreferredBalanceUnit(), true).toString(),
              memo: txMetadata[transaction.hash]?.memo || transaction.memo || '',
              time: transactionTimeToReadable(transaction.received),
            }));

          return {
            label: wallet.getLabel(),
            balance: formatBalance(Number(wallet.getBalance()), wallet.getPreferredBalanceUnit(), true),
            type: wallet.type,
            preferredBalanceUnit: wallet.getPreferredBalanceUnit(),
            receiveAddress,
            transactions,
            hideBalance: wallet.hideBalance,
            ...(wallet.chain === Chain.ONCHAIN &&
              wallet.type !== MultisigHDWallet.type && {
                xpub: wallet.getXpub() || wallet.getSecret(),
              }),
            ...(wallet.allowBIP47() &&
              wallet.isBIP47Enabled() &&
              'getBIP47PaymentCode' in wallet && { paymentCode: wallet.getBIP47PaymentCode() }),
          };
        } catch (error) {
          console.error('Failed to construct wallet:', {
            walletLabel: wallet.getLabel(),
            walletType: wallet.type,
            error,
          });
          return null; // Ensure failed wallet returns null so it's excluded from final results
        }
      }),
    );

    const processedWallets = walletsToProcess
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    console.debug('Constructed wallets to process for Apple Watch');
    return { wallets: processedWallets, randomID: Math.floor(Math.random() * 11) };
  }, [wallets, walletsInitialized, txMetadata]);

}

export default useWatchConnectivity;
