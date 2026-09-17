import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Plain native <select>, styled to match Input/Textarea. The enum
 * pickers here (NodeType, ConfidenceStatus) don't need a popover,
 * search, or multi-select, so this avoids adding @radix-ui/react-select
 * as a dependency for something five fixed options don't require.
 */
function SelectNative({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select-native"
      className={cn(
        "flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { SelectNative };