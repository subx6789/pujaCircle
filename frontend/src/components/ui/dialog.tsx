import * as React from "react"
import { Dialog as BaseDialog } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = BaseDialog.Root

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Trigger> & {
    asChild?: boolean
  }
>(({ asChild, children, render, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return (
      <BaseDialog.Trigger
        ref={ref}
        render={children as React.ReactElement}
        {...props}
      />
    )
  }
  return (
    <BaseDialog.Trigger ref={ref} render={render} {...props}>
      {children}
    </BaseDialog.Trigger>
  )
})
DialogTrigger.displayName = "DialogTrigger"

const DialogPortal = BaseDialog.Portal

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Close> & {
    asChild?: boolean
  }
>(({ asChild, children, render, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return (
      <BaseDialog.Close
        ref={ref}
        render={children as React.ReactElement}
        {...props}
      />
    )
  }
  return (
    <BaseDialog.Close ref={ref} render={render} {...props}>
      {children}
    </BaseDialog.Close>
  )
})
DialogClose.displayName = "DialogClose"

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Backdrop>
>(({ className, ...props }, ref) => (
  <BaseDialog.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = "DialogOverlay"

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof BaseDialog.Popup> {
  onOpenAutoFocus?: (event: any) => void
  onCloseAutoFocus?: (event: any) => void
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <BaseDialog.Popup
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex flex-col w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-3 sm:gap-5 border-2 border-amber-300 bg-card p-3.5 sm:p-6 shadow-2xl rounded-xl duration-200 data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-closed:slide-out-to-left-1/2 data-closed:slide-out-to-top-[48%] data-open:slide-in-from-left-1/2 data-open:slide-in-from-top-[48%] max-h-[90vh] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden min-w-0 box-border",
          className
        )}
        {...props}
      >
        {children}
        <BaseDialog.Close className="absolute right-2.5 top-2.5 sm:right-4 sm:top-4 rounded-md p-1.5 text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </DialogPortal>
  )
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Title>
>(({ className, ...props }, ref) => (
  <BaseDialog.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof BaseDialog.Description>
>(({ className, ...props }, ref) => (
  <BaseDialog.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
