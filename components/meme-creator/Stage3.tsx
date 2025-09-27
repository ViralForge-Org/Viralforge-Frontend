import ShareButtons from "./ShareButtons";
import Image from "next/image";

interface Stage3Props {
  finalMeme: string | null;
  setStage: (stage: number) => void;
  setFinalMeme: (meme: string | null) => void;
  shareText?: string;
}

const Stage3: React.FC<Stage3Props> = ({
  finalMeme,
  setStage,
  setFinalMeme,
  shareText = "Check out this meme I created!",
}) => {
  const handleShare = () => {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleReset = () => {
    setStage(2);
    setFinalMeme(null);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full h-[70vh] bg-gray-900 rounded-lg overflow-hidden mb-4">
        {finalMeme && (
          <Image
            src={finalMeme}
            alt="Generated Meme"
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
      </div>
      <ShareButtons
        handleReset={handleReset}
        handleShare={handleShare}
      />
    </div>
  );
};

export default Stage3;
