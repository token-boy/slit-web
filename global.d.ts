type Dict<T = any> = Record<string, T>

type ReactFC<T = unknown> = React.FC< T & { children: React.ReactNode }>
