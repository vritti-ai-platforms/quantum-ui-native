import type { Meta, StoryObj } from '@storybook/react-native';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../Button';
import { Text } from '../Typography';
import { TextField } from '../TextField';
import { Form } from './Form';
import { StorySection, StoryStack } from '../../storybook/StoryLayout';

const meta = {
  title: 'Components/Form',
  component: Form,
  tags: ['autodocs'],
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

// Login form story
export const LoginForm: Story = {
  render: () => {
    const form = useForm({
      defaultValues: { email: '', password: '' },
    });

    return (
      <StoryStack>
        <StorySection title="Login Form">
          <Form
            form={form}
            onSubmit={(data) => {
              console.log('Submitted:', data);
            }}
          >
            <TextField name="email" label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <TextField name="password" label="Password" placeholder="Enter your password" secureTextEntry />
            <Button submit>
              <Text>Sign In</Text>
            </Button>
          </Form>
        </StorySection>
      </StoryStack>
    );
  },
};

// Form with validation errors
export const WithFieldErrors: Story = {
  render: () => {
    const form = useForm({
      defaultValues: { email: '', password: '' },
    });

    useEffect(() => {
      form.setError('email', { message: 'Please enter a valid email address.' });
      form.setError('password', { message: 'Password must be at least 8 characters.' });
    }, [form]);

    return (
      <StoryStack>
        <StorySection title="Field Validation Errors">
          <Form form={form} onSubmit={() => {}}>
            <TextField name="email" label="Email" placeholder="you@example.com" autoCapitalize="none" />
            <TextField name="password" label="Password" placeholder="Enter your password" secureTextEntry />
            <Button submit>
              <Text>Sign In</Text>
            </Button>
          </Form>
        </StorySection>
      </StoryStack>
    );
  },
};

// Form with root error alert
export const WithRootError: Story = {
  render: () => {
    const form = useForm({
      defaultValues: { email: '', password: '' },
    });

    useEffect(() => {
      form.setError('root', {
        type: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect. Please try again.',
      });
    }, [form]);

    return (
      <StoryStack>
        <StorySection title="Root Error Alert">
          <Form form={form} onSubmit={() => {}} showRootError rootErrorPosition="top">
            <TextField name="email" label="Email" placeholder="you@example.com" autoCapitalize="none" />
            <TextField name="password" label="Password" placeholder="Enter your password" secureTextEntry />
            <Button submit>
              <Text>Sign In</Text>
            </Button>
          </Form>
        </StorySection>
      </StoryStack>
    );
  },
};
