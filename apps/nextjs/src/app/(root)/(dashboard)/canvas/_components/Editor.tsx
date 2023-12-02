"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import type {
  Editor,
  StoreSnapshot,
  TLRecord,
  TLStoreWithStatus,
} from "@tldraw/tldraw"
import {
  createTLStore,
  defaultShapeUtils,
  throttle,
  Tldraw,
} from "@tldraw/tldraw"

import { api } from "~/trpc/client"
import { ExportButton, SaveButton } from "../_components/ExportButton"
import type { LiveImageShape } from "../_components/shapes/LiveImage"
import { LiveImageShapeUtil } from "../_components/shapes/LiveImage"
import { PreviewShapeUtil } from "../_components/shapes/PreviewPage"
import Completion from "./completion"

const shapeUtils = [PreviewShapeUtil, LiveImageShapeUtil]

export default function EditorCanvas({ canvasId }: { canvasId: string }) {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  })

  const onEditorMount = (editor: Editor) => {
    // If there isn't a live image shape, create one
    if (
      !editor
        .getCurrentPageShapes()
        .some((shape) => shape.type === "live-image")
    ) {
      editor.createShape<LiveImageShape>({
        type: "live-image",
        x: 120,
        y: 180,
      })
    }
  }

  const updateCanva = api.canva.update.useMutation({
    onSuccess: (data) => {
      console.log("data saved")
    },
  })

  // Get the snapshot
  const { data: canva, isLoading } = api.canva.getById.useQuery(
    {
      id: canvasId,
    },
    {
      throwOnError: true,
    }
  )

  useLayoutEffect(() => {
    const snapshot = canva?.content as StoreSnapshot<TLRecord>

    if (snapshot) {
      try {
        // Create the store
        const newStore = createTLStore({
          shapeUtils: [...defaultShapeUtils, ...shapeUtils],
        })
        newStore.loadSnapshot(snapshot)
        setStoreWithStatus({ status: "synced-local", store: newStore })
      } catch (error) {
        setStoreWithStatus({
          error: {
            message: JSON.stringify(error),
            name: "Error loading data",
          },
          status: "error",
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, canvasId])

  useEffect(() => {
    // Setup store change listener with throttling
    const store = storeWithStatus.store

    if (!store) return

    const cleanupFn = store.listen(
      throttle((entry) => {
        // instead of saving the whole store, we can save the entry and merge it with the snapshot from the database
        console.log(entry)
        const snapshot = store.getSnapshot()
        console.log("saving data...")
        // TODO: change the state to saving
        // setStoreWithStatus({ status: "not-synced" })

        updateCanva.mutate({
          id: canvasId,
          content: JSON.stringify(snapshot),
        })
      }, 500),
      // filter out changes to the user
      { source: "user", scope: "document" }
    )

    return () => cleanupFn()
  }, [storeWithStatus, canvasId])

  // TODO: get data from server with react-query

  return (
    <main className="z-0 flex h-[calc(100vh-8rem)] w-full flex-col items-center">
      <Tldraw
        onMount={onEditorMount}
        store={storeWithStatus}
        inferDarkMode
        initialState="select"
        components={{
          Background: () => <div className="bg-background-base" />,
        }}
        shapeUtils={shapeUtils}
        shareZone={
          <>
            <ExportButton />
            <SaveButton />
            <Completion />
          </>
        }
      ></Tldraw>{" "}
    </main>
  )
}
