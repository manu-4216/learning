type Props = {
  children?: React.ReactNode
}

export const CodeLayout = (props: Props) => {
  const { children } = props

  return (
    <div style={{ border: 'solid 2px green', padding: '5px' }}>{children}</div>
  )
}
