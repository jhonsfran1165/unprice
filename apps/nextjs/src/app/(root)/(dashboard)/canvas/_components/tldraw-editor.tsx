"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import type {
  StoreSnapshot,
  TLEditorComponents,
  TLRecord,
  TLStoreWithStatus,
} from "@tldraw/tldraw"
import {
  atom,
  createTLStore,
  defaultShapeUtils,
  throttle,
  Tldraw,
} from "@tldraw/tldraw"

import { api } from "~/trpc/client"
import { CodeEditor } from "./code-editor"
import { ExportButton } from "./makereal-button"
import { PreviewShapeUtil, showingEditor } from "./preview-page-shape"

export const editorProjectSlug = atom("editorProjectSlug", "")
const shapeUtils = [PreviewShapeUtil]

const components: TLEditorComponents = {
  InFrontOfTheCanvas: CodeEditor,
}

export default function EditorCanvas({ canvasId }: { canvasId: string }) {
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  })

  const updateCanva = api.canva.update.useMutation({
    onSuccess: () => {
      console.log("canvas saved")
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
    editorProjectSlug.set(canva?.project.slug ?? "")
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
        // console.log(entry)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeWithStatus, canvasId])

  // TODO: get data from server with react-query

  const showing = showingEditor.get()

  return (
    <main className="z-0 flex h-[calc(100vh-8rem)] w-full flex-col items-center">
      <Tldraw
        // onMount={onEditorMount}
        store={storeWithStatus}
        inferDarkMode
        initialState="select"
        components={{
          ...components,
          Background: () => <div />,
        }}
        shapeUtils={shapeUtils}
        hideUi={showing}
        shareZone={
          <>
            <ExportButton />
          </>
        }
      ></Tldraw>{" "}
    </main>
  )
}
