import { Popover, Center, PopoverTrigger, Button, PopoverContent, Stack, Label, Input } from '@extension/ui'
import { Plus } from 'lucide-react'
import {
  useForm,
  z,
  zodResolver,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@extension/ui/lib/components/ui/form'
import { quickUrlItemsStorage } from '@extension/storage'
import { nanoid } from 'nanoid'
import { FC } from 'react'

const addQuickUrlItemShema = z.object({
  title: z.string(),
  url: z.string().url(),
})

interface IAddQuickUrlItemShema extends z.infer<typeof addQuickUrlItemShema> {}

function onSubmit(value: IAddQuickUrlItemShema) {
  quickUrlItemsStorage.add({
    title: value.title,
    url: value.url,
    id: nanoid(),
  })
}

export const AddButton: FC<{ className?: string }> = ({ className }) => {
  const addQuickUrlItemform = useForm<IAddQuickUrlItemShema>({
    resolver: zodResolver(addQuickUrlItemShema),
  })
  return (
    <div className={className}>
      <Popover>
        <Center column>
          <PopoverTrigger asChild>
            <Button size={'icon'} variant={'ghost'} className="rounded-full">
              <Plus />
            </Button>
          </PopoverTrigger>
        </Center>
        <PopoverContent className="">
          <Form {...addQuickUrlItemform}>
            <form onSubmit={addQuickUrlItemform.handleSubmit(onSubmit)}>
              <Stack direction={'column'} className="gap-2">
                <FormField
                  control={addQuickUrlItemform.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input id="title" defaultValue="" className="h-8" {...field} />
                      </FormControl>
                      <FormDescription>This is icon or website name.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addQuickUrlItemform.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Url</FormLabel>
                      <FormControl>
                        <Input id="title" defaultValue="" className="h-8" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="mt-2">
                  Add
                </Button>
              </Stack>
            </form>
          </Form>
        </PopoverContent>
      </Popover>
    </div>
  )
}
