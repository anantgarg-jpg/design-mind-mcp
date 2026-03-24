import React from 'react'
import { useForm } from 'react-hook-form'
import { FormLayout, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@blocks/Form/component'
import { Fixture, PageHeader } from '@/components/Fixture'
import { InputBlock as Input } from '@blocks/Input/component'

interface ContactForm {
  name: string
  email: string
}

function DemoForm({ submitting = false }: { submitting?: boolean }) {
  const form = useForm<ContactForm>({
    defaultValues: { name: '', email: '' },
    mode: 'onChange',
  })

  return (
    <FormLayout
      form={form}
      onSubmit={(values) => console.log('Submitted:', values)}
      submitLabel="Save Contact"
      isSubmitting={submitting}
    >
      <FormField
        control={form.control}
        name="name"
        rules={{ required: 'Name is required' }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter full name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        rules={{ required: 'Email is required' }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="name@example.com" type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormLayout>
  )
}

export function FormPage() {
  return (
    <div>
      <PageHeader
        name="Form"
        level="composite"
        confidence={0.80}
        description="A form layout wrapper integrating react-hook-form with a submit section and field-level validation."
      />

      <div className="flex flex-col gap-6">
        <Fixture label="Default form with two fields" bg="bg-background">
          <div className="max-w-md">
            <DemoForm />
          </div>
        </Fixture>

        <Fixture label="Submitting state" bg="bg-background">
          <div className="max-w-md">
            <DemoForm submitting />
          </div>
        </Fixture>
      </div>
    </div>
  )
}
