const video = document.getElementById("video-recording");
const videoMetadataContainer = document.getElementById("video-metadata");

const videoPath = "./videos/recording-1.mov";
let videoObjectUrlLink = null;

const videoMetadata = {
  file_information: {
    file_name: "",
    file_size_bytes: 0,
    file_size_mb: 0,
    file_type: "",
    file_extension: "",
    last_modified_date: "",
  },
  video_information: {
    duration: "",
    width: "",
    height: "",
    resolution: "",
    aspect_ratio: "",
    estimated_overall_bitrate_mbps: "",
  },
  playback_information: {
    current_playback_time: "",
    total_duration: "",
    playback_status: "",
  },
  calculated_information: {
    total_pixels_per_frame: "",
  },
  basic_file_validation: {
    is_playable: "",
    is_metadata_loaded: "",
    is_video_dimensions_valid: "",
    is_duration_finite: "",
  },
};

// adding event listeners
video.addEventListener("pause", () => {
  videoMetadata.playback_information.playback_status = "Paused";
  populateMetadata(videoMetadata);
});

video.addEventListener("play", () => {
  videoMetadata.playback_information.playback_status = "Playing";
  populateMetadata(videoMetadata);
});

video.addEventListener("ended", () => {
  videoMetadata.playback_information.playback_status = "Ended";
  populateMetadata(videoMetadata);
});

video.addEventListener("timeupdate", () => {
  videoMetadata.playback_information.current_playback_time = video.currentTime;
  populateMetadata(videoMetadata);
});

window.addEventListener("beforeunload", () => {
  if (videoObjectUrlLink) {
    URL.revokeObjectURL(videoObjectUrlLink);
  }
});

function aspectRatio(width, height) {
  if (!width || !height) return "Unknown";

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

async function videoMediaInspector() {
  // remove if a video is already referenced in memory
  if (videoObjectUrlLink) {
    URL.revokeObjectURL(videoObjectUrlLink);
  }

  const response = await fetch(videoPath);

  if (!response.ok) {
    throw new Error("failed to fetch video");
  }

  const blobData = await response.blob();
  const fileName = videoPath.split("/").pop();

  const file = new File([blobData], fileName, {
    type: blobData.type,
  });

  videoObjectUrlLink = URL.createObjectURL(file);

  video.preload = "metadata";
  video.src = videoObjectUrlLink;

  await new Promise((resolve, reject) => {
    video.addEventListener("loadedmetadata", resolve, { once: true });
    video.addEventListener(
      "error",
      () => reject(new Error("failed to load video metadata")),
      { once: true },
    );
  });

  const { videoWidth: width, videoHeight: height, duration } = video;

  videoMetadata.file_information = {
    file_name: file.name,
    file_size_bytes: file.size,
    file_size_mb: Number((file.size / 1024 / 1024).toFixed(2)),
    file_type: file.type,
    file_extension: file.name.split(".").pop(),
    last_modified_date: new Date(file.lastModified).toISOString(),
  };
  videoMetadata.video_information = {
    duration,
    width,
    height,
    resolution: `${width} × ${height}`,
    aspect_ratio: aspectRatio(width, height),
    estimated_overall_bitrate_mbps: Number(
      ((file.size * 8) / duration / 1_000_000).toFixed(2),
    ),
  };
  videoMetadata.playback_information = {
    current_playback_time: video.currentTime,
    total_duration: duration,
    playback_status: video.paused ? "Paused" : "Playing",
  };
  videoMetadata.calculated_information = {
    total_pixels_per_frame: width * height,
  };
  videoMetadata.basic_file_validation = {
    is_playable: video.error === null,
    is_metadata_loaded: video.readyState >= HTMLMediaElement.HAVE_METADATA,
    is_video_dimensions_valid: width > 0 && height > 0,
    is_duration_finite: Number.isFinite(duration),
  };
}

function populateMetadata(metadata) {
  const {
    file_information,
    video_information,
    playback_information,
    calculated_information,
    basic_file_validation,
  } = metadata;

  document.getElementById("file-name").textContent = file_information.file_name;
  document.getElementById("file-size").textContent =
    file_information.file_size_mb + " MB";
  document.getElementById("file-type").textContent = file_information.file_type;
  document.getElementById("file-extension").textContent =
    file_information.file_extension;
  document.getElementById("last-modified-date").textContent =
    file_information.last_modified_date;
  document.getElementById("duration").textContent =
    video_information.duration + " seconds";
  document.getElementById("width").textContent =
    video_information.width + " pixels";
  document.getElementById("height").textContent =
    video_information.height + " pixels";
  document.getElementById("resolution").textContent =
    video_information.resolution + " pixels";
  document.getElementById("aspect-ratio").textContent =
    video_information.aspect_ratio;
  document.getElementById("estimated-overall-bitrate").textContent =
    video_information.estimated_overall_bitrate_mbps + " Mbps";
  document.getElementById("current-playback-time").textContent =
    playback_information.current_playback_time + " seconds";
  document.getElementById("total-duration").textContent =
    playback_information.total_duration + " seconds";
  document.getElementById("playback-status").textContent =
    playback_information.playback_status;
  document.getElementById("total-pixels-per-frame").textContent =
    calculated_information.total_pixels_per_frame + " pixels";
  document.getElementById("basic-file-validation").textContent =
    basic_file_validation.is_playable ? "Yes" : "No";
}

try {
  await videoMediaInspector();
  console.log("videoMetadata", videoMetadata);
  populateMetadata(videoMetadata);
} catch (error) {
  console.error(error);
}
