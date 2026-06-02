import * as AvatarPrimitive from '@rn-primitives/avatar';
import { TextClassContext } from '../../components/Text';
import { cn } from '../../utils/index';

// RN analog of the web shadcnAvatar — Root + Image + Fallback, with a size variant.
// (The web AvatarBadge/AvatarGroup/AvatarGroupCount rely on web-only group-data/has-data CSS
//  selectors that NativeWind can't express, so they're not ported.)
function Avatar({
  className,
  size = 'default',
  ...props
}: AvatarPrimitive.RootProps &
  React.RefAttributes<AvatarPrimitive.RootRef> & {
    size?: 'default' | 'sm' | 'lg';
  }) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative size-8 shrink-0 overflow-hidden rounded-full',
        size === 'sm' && 'size-6',
        size === 'lg' && 'size-10',
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: AvatarPrimitive.ImageProps & React.RefAttributes<AvatarPrimitive.ImageRef>) {
  return <AvatarPrimitive.Image className={cn('aspect-square size-full', className)} {...props} />;
}

function AvatarFallback({
  className,
  children,
  ...props
}: AvatarPrimitive.FallbackProps & React.RefAttributes<AvatarPrimitive.FallbackRef>) {
  // Push the muted text style to the fallback's text children (RN has no CSS color inheritance),
  // mirroring the web's `text-muted-foreground text-sm` on the fallback.
  return (
    <AvatarPrimitive.Fallback
      className={cn('bg-muted flex size-full flex-row items-center justify-center rounded-full', className)}
      {...props}
    >
      <TextClassContext.Provider value="text-muted-foreground text-sm">{children}</TextClassContext.Provider>
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
