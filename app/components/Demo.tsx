import { useEffect, useCallback, useState } from "react";
import sdk, { type FrameContext } from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
} from "wagmi";

interface Beat {
  id: number;
  title: string;
  price: string;
  audioUrl: string;
  coverUrl: string;
}

export default function Demo() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [txHash] = useState<string | null>(null);

  const {isConnected } = useAccount();
  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    // isPending: isSendTxPending,
  } = useSendTransaction();
  const { disconnect } = useDisconnect();
//   const { connect } = useConnect();
  const { connect, connectors } = useConnect();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash as `0x${string}` });

  useEffect(() => {
    const load = async () => {
      setContext(await sdk.context);
      sdk.actions.ready();

      setBeats([
        {
          id: 1,
          title: "Chill Vibes",
          price: "0.02", // ETH
          audioUrl: "/audio/chill-vibes.mp3",
          coverUrl: "/beat1.jpeg",
        },
        {
          id: 2,
          title: "Epic Drops",
          price: "0.05", // ETH
          audioUrl: "/audio/epic-drops.mp3",
          coverUrl: "/beat2.jpeg",
        },
        {
          id: 3,
          title: "Lo-fi Groove",
          price: "0.01", // ETH
          audioUrl: "/audio/lofi-groove.mp3",
          coverUrl: "/beat3.jpeg",
        },
      ]);
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const buyBeat = useCallback(
    async (beat: Beat) => {
      if (!isConnected) {
        alert("Please connect your wallet to buy this beat.");
        return;
      }
  
      try {
        // Send the transaction
        sendTransaction({
          to: "0x5F1d11Ebb824b3699D8E4E75B5Ddf6C2635c71Db", // Replace with your smart contract address
          value: BigInt(parseFloat(beat.price) * 1e18), // Convert ETH to Wei
        });
  
        // Monitor transaction receipt using wagmi hooks
        alert("Transaction sent! Check your wallet or transaction tracker for updates.");
      } catch (error) {
        console.error("Transaction failed:", error);
        alert("Transaction failed. Please try again.");
      }
    },
    [isConnected, sendTransaction]
  );
  

  const redirect = useCallback(() => {
    sdk.actions.openUrl("https://example-redirect-url.com");
  }, []);

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  const renderError = (error: Error | null) => {
    if (!error) return null;
    return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
  };

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6 space-y-4">
        <button
          onClick={redirect}
          className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600"
        >
          See more on website
        </button>

        <button
          onClick={() =>
            isConnected ? disconnect() : connect({ connector: connectors[0] })
          }
          className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
        >
          {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
        </button>

        {isSendTxError && renderError(sendTxError)}
        {txHash && (
          <div className="mt-2 text-xs">
            <div>Transaction Hash: {txHash}</div>
            <div>
              Status:{" "}
              {isConfirming
                ? "Confirming..."
                : isConfirmed
                ? "Confirmed!"
                : "Pending"}
            </div>
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold text-center mb-4">Soundlink</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {beats.map((beat) => (
          <div
            key={beat.id}
            className="border rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800"
          >
            <img
              src={beat.coverUrl}
              alt={`${beat.title} cover`}
              className="rounded-md w-full h-40 object-cover mb-4"
            />
            <h3 className="text-lg font-semibold">{beat.title}</h3>
            <p className="text-gray-500 mb-4">{beat.price} ETH</p>
            <audio controls src={beat.audioUrl} className="w-full mb-4">
              Your browser does not support the audio element.
            </audio>
            <button
              onClick={() => buyBeat(beat)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Context</h2>
        <button
          onClick={toggleContext}
          className="flex items-center gap-2 transition-colors"
        >
          <span
            className={`transform transition-transform ${
              isContextOpen ? "rotate-90" : ""
            }`}
          >
            ➤
          </span>
          Tap to expand
        </button>

        {isContextOpen && (
          <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-auto">
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}