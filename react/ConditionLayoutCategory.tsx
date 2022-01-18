import React, { useMemo } from 'react'
import type { ComponentType } from 'react'
import { useRuntime } from 'vtex.render-runtime'
import { useQuery } from 'react-apollo'

import ConditionLayout from './ConditionLayout'
import type { NoUndefinedField, MatchType, Condition, Handlers } from './types'
import getCategoryParentId from './graphql/getCategoryParentId.graphql'

type Decr = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface Props {
  conditions: Array<Condition<ContextValues, HandlerArguments>>
  matchType?: MatchType
  Else?: ComponentType
  Then?: ComponentType
}

interface CategoryTree {
  categories: Array<CategoryItem<3>>
}

type CategoryItem<N extends number> = N extends 0
  ? {
      id: number
    }
  : { id: number; children: Array<CategoryItem<Decr[N]>> }

interface ContextValues {
  [key: string]: string | Array<CategoryItem<3>>
  id: string
  type: 'category' | 'department' | 'subcategory'
  categoryTree: Array<CategoryItem<3>>
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
      const department = values.categoryTree?.find(
        (departmentItem: CategoryItem<2>) =>
          departmentItem?.children?.find(
            (category) => String(category?.id) === values?.id
          )
      )

      return (
        args.ids.includes(String(department?.id)) ||
        args.ids.includes(values.id)
      )
    }

    if (values.type === 'subcategory') {
      const department = values.categoryTree?.find(
        (departmentItem: CategoryItem<2>) =>
          departmentItem?.children?.find((category) =>
            category?.children?.find(
              (subcategory) => String(subcategory?.id) === values?.id
            )
          )
      )

      const category = department?.children?.find(
        (categoryItem: CategoryItem<1>) =>
          categoryItem?.children?.find(
            (subcategory) => String(subcategory?.id) === values?.id
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

  const { data } = useQuery<CategoryTree>(getCategoryParentId)

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
