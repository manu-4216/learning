type Props = {
  children?: React.ReactNode
}

export const ExampleLayout = (props: Props) => {
  const { children } = props

  return <div style={{ padding: '10px' }}>{children}</div>
}
