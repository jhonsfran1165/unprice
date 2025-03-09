import { cn } from "@unprice/ui/utils"
import { Highlight, themes } from "prism-react-renderer"

export function CodeEditor({ codeBlock, language }: { codeBlock: string; language: string }) {
  return (
    <Highlight code={codeBlock} language={language} theme={themes.nightOwlLight}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => {
        return (
          <pre
            className={cn("overflow-x-auto text-sm", className)}
            style={{ ...style, background: "transparent" }}
          >
            {tokens.map((line, i) => {
              const { key: lineKey, ...lineProps } = getLineProps({
                line,
                key: i,
              })

              return (
                <div key={i.toString()} {...lineProps} className="table-row">
                  <span className="table-cell select-none pr-4 text-right text-background-line">
                    {i + 1}
                  </span>
                  <span className="table-cell whitespace-pre">
                    {line.map((token, j) => {
                      const { key: tokenKey, ...tokenProps } = getTokenProps({
                        token,
                        key: j,
                      })
                      return <span key={j.toString()} {...tokenProps} />
                    })}
                  </span>
                </div>
              )
            })}
          </pre>
        )
      }}
    </Highlight>
  )
}
