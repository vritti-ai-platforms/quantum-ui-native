import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button';
import { Text } from '../Typography';
import { BottomSheet } from './BottomSheet';
import type { BottomSheetProps } from './types';

type DemoProps = Partial<Omit<BottomSheetProps, 'isVisible' | 'onClose' | 'children'>>;

function Demo(props: DemoProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, height: 600, padding: 24 }}>
      <Button onPress={() => setOpen(true)}>
        <Text>Open sheet</Text>
      </Button>
      <BottomSheet isVisible={open} onClose={() => setOpen(false)} {...props}>
        <View style={{ padding: 24, gap: 8 }}>
          <Text className="text-lg font-semibold">Sheet content</Text>
          <Text>Swipe down or tap the backdrop to close.</Text>
        </View>
      </BottomSheet>
    </View>
  );
}

function MultiSheetDemo() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <View style={{ flex: 1, height: 600, padding: 24, gap: 12 }}>
      <Button onPress={() => setDetailsOpen(true)}>
        <Text>Open details sheet</Text>
      </Button>
      <Button onPress={() => setActionsOpen(true)}>
        <Text>Open actions sheet</Text>
      </Button>

      <BottomSheet isVisible={detailsOpen} onClose={() => setDetailsOpen(false)}>
        <View style={{ padding: 24, gap: 8 }}>
          <Text className="text-lg font-semibold">Details</Text>
          <Text>This sheet verifies one portal instance can open and close cleanly.</Text>
        </View>
      </BottomSheet>

      <BottomSheet
        isVisible={actionsOpen}
        onClose={() => setActionsOpen(false)}
        snapPoints={['35%', '65%']}
      >
        <View style={{ padding: 24, gap: 8 }}>
          <Text className="text-lg font-semibold">Actions</Text>
          <Text>This second sheet should not replace or collide with the first one.</Text>
        </View>
      </BottomSheet>
    </View>
  );
}

const meta = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
  args: {
    isVisible: false,
    onClose: () => {},
    children: null,
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Demo />,
};

export const CustomSnapPoints: Story = {
  render: () => <Demo snapPoints={['25%', '50%', '90%']} initialSnapIndex={1} />,
};

export const NoHandle: Story = {
  render: () => <Demo showHandle={false} />,
};

export const NonDismissibleBackdrop: Story = {
  render: () => <Demo closeOnBackdrop={false} />,
};

export const MultipleSheets: Story = {
  render: () => <MultiSheetDemo />,
};
