import { useCallback, useEffect, useRef, useState } from "react"
import type { TLBaseShape, TLEventMapHandler } from "@tldraw/tldraw"
import {
  Box2d,
  getSvgAsImage,
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  useEditor,
} from "@tldraw/tldraw"

import { useDebounce } from "~/lib/use-debounce"

// See https://www.fal.ai/models/latent-consistency-sd

const LatentConsistency = "110602490-lcm-sd15-i2i"

interface Input {
  prompt: string
  image_url: string
  sync_mode: boolean
  seed: number
}

interface Output {
  images: {
    url: string
    width: number
    height: number
  }[]
  seed: number
  num_inference_steps: number
}

// TODO make this an input on the canvas
const PROMPT = "a sunset at a tropical beach with palm trees"

export function LiveImage() {
  const editor = useEditor()
  const [image, setImage] = useState<string | null>(null)

  // Used to prevent multiple requests from being sent at once for the same image
  // There's probably a better way to do this using TLDraw's state
  const imageDigest = useRef<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onDrawingChange = useCallback(
    useDebounce(async () => {
      // TODO get actual drawing bounds
      const bounds = new Box2d(120, 180, 512, 512)

      const shapes = editor.getCurrentPageShapes().filter((shape) => {
        if (shape.type === "live-image") {
          return false
        }
        const pageBounds = editor.getShapeMaskedPageBounds(shape)
        if (!pageBounds) {
          return false
        }
        return bounds.includes(pageBounds)
      })

      // Check if should submit request
      const shapesDigest = JSON.stringify(shapes)
      if (shapesDigest === imageDigest.current) {
        return
      }
      imageDigest.current = shapesDigest

      const svg = await editor.getSvg(shapes, { bounds, background: true })
      if (!svg) {
        return
      }
      const image = await getSvgAsImage(svg, editor.environment.isSafari, {
        type: "png",
        quality: 0.5,
        scale: 1,
      })
      if (!image) {
        return
      }

      // const imageDataUri = await blobToDataUri(image);
      // const result = await fal.run<Input, Output>(LatentConsistency, {
      //   input: {
      //     image_url: imageDataUri,
      //     prompt: PROMPT,
      //     sync_mode: true,
      //     seed: 42, // TODO make this configurable in the UI
      //   },
      //   // Disable auto-upload so we can submit the data uri of the image as is
      //   autoUpload: false,
      // });
      // if (result && result.images.length > 0) {
      //   setImage(result.images[0].url);
      // }
    }, 500),
    []
  )

  useEffect(() => {
    const onChange: TLEventMapHandler<"change"> = (event) => {
      if (event.source !== "user") {
        return
      }
      if (
        Object.keys(event.changes.added).length ||
        Object.keys(event.changes.removed).length ||
        Object.keys(event.changes.updated).length
      ) {
        void onDrawingChange()
      }
    }
    editor.addListener("change", onChange)
    return () => {
      editor.removeListener("change", onChange)
    }
  }, [])

  return (
    <HTMLContainer className="tl-embed-container">
      <div className="absolute z-50 flex h-[560px] w-[1060px] flex-row space-x-4 rounded border border-indigo-500 bg-indigo-200 p-4 pb-8">
        <div className="h-[512px] flex-1 border border-indigo-500 bg-white">
          <div className="flex flex-row items-center space-x-2 px-4 py-2">
            <span className="font-mono text-indigo-900/50">/imagine</span>
            <input
              className="flex-1 border-0 bg-transparent text-base text-indigo-900"
              placeholder="something cool..."
              value={PROMPT}
            />
          </div>
        </div>
        <div className="h-[512px] flex-1 border border-indigo-500 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image && <img src={image} alt="" width={512} height={512} />}
        </div>
      </div>
    </HTMLContainer>
  )
}

export type LiveImageShape = TLBaseShape<"live-image", { w: number; h: number }>

export class LiveImageShapeUtil extends ShapeUtil<LiveImageShape> {
  static override type = "live-image" as const

  getDefaultProps(): LiveImageShape["props"] {
    return {
      w: 1060,
      h: 560,
    }
  }

  getGeometry(shape: LiveImageShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: LiveImageShape) {
    return <LiveImage />
  }

  indicator(shape: LiveImageShape) {
    return <rect width={shape.props.w} height={shape.props.h} radius={4}></rect>
  }
}
