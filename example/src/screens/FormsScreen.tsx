import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { Checkbox } from '@vritti/quantum-ui-native/Checkbox';
import { Input } from '@vritti/quantum-ui-native/Input';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import {
  RadioGroup,
  RadioGroupItem,
} from '@vritti/quantum-ui-native/RadioGroup';
import { Switch } from '@vritti/quantum-ui-native/Switch';
import { Section } from '../components/Section';

export default function FormsScreen() {
  const [checkboxVal, setCheckboxVal] = useState(false);
  const [switchVal, setSwitchVal] = useState(false);
  const [radioVal, setRadioVal] = useState('free');

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-5 pb-6 gap-6"
    >
      <Text variant="h2" className="text-foreground">
        Forms
      </Text>

      {/* TextField */}
      <Section title="Text Field">
        <TextField
          label="Email"
          placeholder="you@example.com"
          hint="We'll never share your email"
        />
        <TextField
          label="Password"
          placeholder="Enter password"
          secureTextEntry
        />
        <TextField
          label="With Error"
          placeholder="Required"
          error="This field is required"
        />
      </Section>

      {/* Multiline TextField */}
      <Section title="Multiline Text Field">
        <TextField
          label="Bio"
          placeholder="Tell us about yourself..."
          hint="Max 500 characters"
          multiline
        />
        <TextField
          label="Notes"
          placeholder="Add notes..."
          error="Notes cannot be empty"
          multiline
        />
      </Section>

      {/* Input raw */}
      <Section title="Input">
        <Input placeholder="Basic input..." />
      </Section>

      {/* Checkbox */}
      <Section title="Checkbox">
        <Checkbox
          checked={checkboxVal}
          onCheckedChange={setCheckboxVal}
          label="Accept terms and conditions"
          description="You agree to our terms of service"
        />
        <Checkbox
          checked={false}
          onCheckedChange={() => {}}
          label="With error"
          error="You must accept"
        />
        <Checkbox
          onCheckedChange={() => {}}
          checked
          disabled
          label="Disabled checked"
        />
      </Section>

      {/* Switch */}
      <Section title="Switch">
        <Switch
          checked={switchVal}
          onCheckedChange={setSwitchVal}
          label="Dark mode"
        />
        <Switch
          checked={false}
          onCheckedChange={() => {}}
          label="With error"
          error="Must be enabled"
        />
        <Switch checked onCheckedChange={() => {}} disabled label="Disabled" />
      </Section>

      {/* RadioGroup */}
      <Section title="Radio Group">
        <RadioGroup
          value={radioVal}
          onValueChange={setRadioVal}
          label="Select a plan"
        >
          <RadioGroupItem
            value="free"
            label="Free"
            onPress={() => setRadioVal('free')}
          />
          <RadioGroupItem
            value="pro"
            label="Pro"
            onPress={() => setRadioVal('pro')}
          />
          <RadioGroupItem
            value="enterprise"
            label="Enterprise"
            onPress={() => setRadioVal('enterprise')}
          />
        </RadioGroup>
      </Section>
    </ScrollView>
  );
}
