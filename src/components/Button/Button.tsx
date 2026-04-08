import { View } from "react-native";
import {
	buttonTextVariants,
	buttonVariants,
	Button as RnrButton,
	type ButtonProps as RnrButtonProps,
} from "../../reusables/button";
import { Text } from "../../reusables/text";
import { cn } from "../../utils/cn";
import { Spinner } from "../Spinner";

export interface ButtonProps extends RnrButtonProps {
	isLoading?: boolean;
	loadingText?: string;
}

// Button with built-in loading state — wraps the reusable Button
function Button({
	isLoading,
	loadingText,
	children,
	variant,
	size,
	disabled,
	className,
	...props
}: ButtonProps) {
	const isDisabled = disabled || isLoading;

	if (isLoading) {
		return (
			<RnrButton
				variant={variant}
				size={size}
				disabled
				className={cn("opacity-50 bg-red", className)}
				{...props}
			>
				<View className="flex-row items-center gap-2">
					<Spinner size="small" />
					<Text className={cn(buttonTextVariants({ variant, size }))}>
						{loadingText ??
							(typeof children === "string" ? children : "Loading...")}
					</Text>
				</View>
			</RnrButton>
		);
	}

	return (
		<RnrButton
			variant={variant}
			size={size}
			disabled={isDisabled}
			className={className}
			{...props}
		>
			{children}
		</RnrButton>
	);
}

Button.displayName = "Button";

export { Button, buttonTextVariants, buttonVariants };
