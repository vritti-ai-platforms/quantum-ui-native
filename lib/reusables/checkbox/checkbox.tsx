import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { COMMON_ICONS, DynamicIcon } from '../../components/DynamicIcon';
import { cn } from '../../utils/index';

// RN analog of the web shadcnCheckbox — wraps @rn-primitives/checkbox with theming.
// Controlled: requires `checked` + `onCheckedChange`.
function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.RootProps & React.RefAttributes<CheckboxPrimitive.RootRef>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'border-input dark:bg-input/30 size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-sm shadow-black/5',
        props.checked && 'bg-primary border-primary dark:bg-primary',
        props.disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="items-center justify-center">
        <DynamicIcon icon={COMMON_ICONS.check} size={8} className="text-primary-foreground" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
