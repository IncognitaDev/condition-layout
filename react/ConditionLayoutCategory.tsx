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
  type: 'category' | 'department'
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
    if (values.type !== 'department' && values.type !== 'category') {
      return false
    }

    return (
      args.ids.includes(values.id) || args.ids.includes(values.parentCategoryId)
    )
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

  const { data } = useQuery(getCategoryParentId, {
    variables: {
      id,
    },
  })

  const values = useMemo<ContextValues>(() => {
    const bag = {
      id,
      type,
      parentCategoryId: data?.category?.parentCategoryId,
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
