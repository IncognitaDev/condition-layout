import React, { useMemo } from 'react'
import type { ComponentType } from 'react'
import { useRuntime } from 'vtex.render-runtime'
import { useQuery } from 'react-apollo'

import ConditionLayout from './ConditionLayout'
import type { NoUndefinedField, MatchType, Condition, Handlers } from './types'
import getCategoryParentId from './graphql/getCategoryParentId.graphql'

interface Props {
  conditions: Array<Condition<ContextValues, HandlerArguments>>
  matchType?: MatchType
  Else?: ComponentType
  Then?: ComponentType
}

interface ContextValues {
  [key: string]: string
  id: string
  type: 'category' | 'department' | 'subcategory'
  categoryTree: any
}

interface HandlerArguments {
  category: { ids: string[] }
  department: { ids: string[] }
  categoryTree: { ids: string[] }
}

const handlersMap: Handlers<ContextValues, HandlerArguments> = {
  category({ values, args }) {
    if (values.type !== 'category') {
      return false
    }

    return args.ids.includes(values.id)
  },
  department({ values, args }) {
    if (values.type !== 'department') {
      return false
    }

    return args.ids.includes(values.id)
  },
  categoryTree({ values, args }) {
    if (
      values.type !== 'department' &&
      values.type !== 'category' &&
      values.type !== 'subcategory'
    ) {
      return false
    }

    if (values.type === 'category') {
      const department = values.categoryTree?.find((department: any) =>
        department?.children?.find(
          (category: any) => category?.id == values?.id
        )
      )

      return (
        args.ids.includes(String(department?.id)) ||
        args.ids.includes(values.id)
      )
    }

    if (values.type === 'subcategory') {
      const department = values.categoryTree?.find((department: any) =>
        department?.children?.find((category: any) =>
          category?.children?.find(
            (subcategory: any) => subcategory?.id == values?.id
          )
        )
      )

      const category = department?.children?.filter((category: any) =>
        category?.children?.find(
          (subcategory: any) => subcategory?.id == values?.id
        )
      )

      return (
        args.ids.includes(String(department?.id)) ||
        args.ids.includes(String(category?.id)) ||
        args.ids.includes(values.id)
      )
    }

    return args.ids.includes(values.id)
  },
}

const ConditionLayoutCategory: StorefrontFunctionComponent<Props> = ({
  Else,
  Then,
  matchType,
  conditions,
  children,
}) => {
  const {
    route: {
      pageContext: { id, type },
    },
  } = useRuntime()

  const { data } = useQuery(getCategoryParentId)

  const values = useMemo<ContextValues>(() => {
    const bag = {
      id,
      type,
      categoryTree: data?.categories,
    }

    // We use `NoUndefinedField` to remove optionality + undefined values from the type
    return bag as NoUndefinedField<typeof bag>
  }, [id, type, data])

  return (
    <ConditionLayout
      Else={Else}
      Then={Then}
      matchType={matchType}
      conditions={conditions}
      values={values}
      handlers={handlersMap}
    >
      {children}
    </ConditionLayout>
  )
}

export default ConditionLayoutCategory
