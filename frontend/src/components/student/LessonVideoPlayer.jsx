import { useMemo } from 'react';
import ReactPlayer from 'react-player';
import { resolveLessonVideoUrl } from '../../utils/mediaUrl.js';

/** Self-hosted files: native video for reliable playback; streams use ReactPlayer for one consistent shell. */
function isDirectFileUrl(u) {
  if (!u) return false;
  const path = u.split('?')[0].toLowerCase();
  if (/\/uploads\/videos\//i.test(path)) return true;
  return /\.(mp4|webm|ogg|mov|m4v|mpeg|mpg|mkv)(\?|$)/i.test(path);
}

export default function LessonVideoPlayer({ url, lessonTitle }) {
  const playbackUrl = useMemo(() => resolveLessonVideoUrl(url), [url]);

  if (!playbackUrl) return null;

  const useNativeVideo = isDirectFileUrl(playbackUrl);

  if (useNativeVideo) {
    return (
      <video
        key={playbackUrl}
        src={playbackUrl}
        controls
        playsInline
        controlsList="nodownload"
        preload="auto"
        className="lesson-native-video lesson-player-focus"
        aria-label={lessonTitle ? `Video: ${lessonTitle}` : 'Lesson video'}
        onError={(e) => {
          const err = e.currentTarget.error;
          console.error('[LessonVideo]', playbackUrl, 'MediaError', err?.code, err?.message);
        }}
      />
    );
  }

  return (
    <div className="lesson-player-focus absolute inset-0">
      <ReactPlayer
        key={playbackUrl}
        url={playbackUrl}
        width="100%"
        height="100%"
        controls
        playing={false}
        playsinline
        pip
        className="lesson-react-player"
        config={{
          youtube: { playerVars: { modestbranding: 1, rel: 0, playsinline: 1 } },
          vimeo: { playerOptions: { playsinline: true } },
          file: {
            forceVideo: true,
            attributes: {
              controlsList: 'nodownload',
              playsInline: true,
              className: 'h-full w-full object-contain',
              'aria-label': lessonTitle ? `Video: ${lessonTitle}` : 'Lesson video',
            },
          },
        }}
      />
    </div>
  );
}
