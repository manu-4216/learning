type Props = {
  children?: React.ReactNode
}

export const DocumentationLayout = (props: Props) => {
  const { children } = props

  return (
    <div>
      <div style={{ borderBottom: 'solid 1px gray', paddingBottom: '5px' }}>
        {children}
      </div>
      <h4 style={{ margin: '20px 0 10px 0' }}>Code demo</h4>
    </div>
  )
}
