export const codeTemplates = {
  javascript: {
    function: `function functionName(params) {\n  // TODO: Implement function\n  return result;\n}`,
    class: `class ClassName {\n  constructor() {\n    // Initialize\n  }\n\n  method() {\n    // TODO: Implement method\n  }\n}`,
    async: `async function asyncFunction() {\n  try {\n    const result = await promise;\n    return result;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}`,
    component: `import React from 'react';\n\nconst Component = () => {\n  return (\n    <div>\n      {/* Component content */}\n    </div>\n  );\n};\n\nexport default Component;`,
  },
  typescript: {
    interface: `interface InterfaceName {\n  property: string;\n  method(): void;\n}`,
    type: `type TypeName = {\n  property: string;\n}`,
    enum: `enum EnumName {\n  Value1 = 'VALUE_1',\n  Value2 = 'VALUE_2',\n}`,
    component: `import React from 'react';\n\ninterface Props {\n  // Define props\n}\n\nconst Component: React.FC<Props> = (props) => {\n  return (\n    <div>\n      {/* Component content */}\n    </div>\n  );\n};\n\nexport default Component;`,
  },
  python: {
    function: `def function_name(params):\n    """Function description"""\n    # TODO: Implement function\n    return result`,
    class: `class ClassName:\n    """Class description"""\n    \n    def __init__(self):\n        """Initialize class"""\n        pass\n    \n    def method(self):\n        """Method description"""\n        pass`,
    async: `import asyncio\n\nasync def async_function():\n    """Async function description"""\n    try:\n        result = await coroutine()\n        return result\n    except Exception as e:\n        print(f"Error: {e}")`,
  },
} as const

export type Language = keyof typeof codeTemplates
export type TemplateType<L extends Language> = keyof typeof codeTemplates[L]

export const getTemplate = (language: Language, type: string): string | undefined => {
  const templates = codeTemplates[language]
  if (templates && type in templates) {
    return (templates as any)[type]
  }
  return undefined
}

export const getAvailableTemplates = (language: Language): string[] => {
  const templates = codeTemplates[language]
  return templates ? Object.keys(templates) : []
}
