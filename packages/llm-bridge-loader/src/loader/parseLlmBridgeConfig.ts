import { LlmManifest, JSONSchema, JSONObjectSchema } from 'llm-bridge-spec';
import { z } from 'zod';

/**
 * LLM 브릿지 설정을 파싱하는 함수
 * @param manifest LLM 매니페스트
 * @returns 설정을 검증하는 함수
 */
export function parseLlmBridgeConfig(manifest: LlmManifest): z.AnyZodObject {
  const jsonSchema = manifest.configSchema;

  assertObjectSchema(jsonSchema);

  if (!jsonSchema.properties) {
    return z.object({});
  }

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, value] of Object.entries(jsonSchema.properties)) {
    const fieldSchema = convertJsonSchemaToZod(value);
    shape[key] = jsonSchema.required?.includes(key) ? fieldSchema : fieldSchema.optional();
  }

  return z.object(shape);
}

function assertObjectSchema(schema: JSONSchema): asserts schema is JSONObjectSchema {
  if (schema.type !== 'object') {
    throw new Error('Config schema must be an object');
  }
}

/**
 * JSON 스키마 타입을 Zod 타입으로 변환하는 함수
 * @param schema JSON 스키마
 * @returns Zod 스키마
 */
function convertJsonSchemaToZod(schema: JSONSchema): z.ZodTypeAny {
  if (!schema.type) {
    return z.any();
  }

  switch (schema.type) {
    case 'string': {
      if (schema.enum && Array.isArray(schema.enum)) {
        const enumValues = schema.enum as [string, ...string[]];
        return z.enum(enumValues);
      }
      return z.string();
    }

    case 'number': {
      return z.number();
    }

    case 'integer': {
      return z.number().int();
    }

    case 'boolean': {
      return z.boolean();
    }

    case 'object': {
      if (!schema.properties) {
        return z.record(z.any());
      }

      const shape: Record<string, z.ZodTypeAny> = {};

      for (const [key, value] of Object.entries(schema.properties)) {
        const fieldSchema = convertJsonSchemaToZod(value);
        shape[key] = schema.required?.includes(key) ? fieldSchema : fieldSchema.optional();
      }

      return z.object(shape);
    }

    case 'array': {
      if (!schema.items) {
        return z.array(z.any());
      }
      return z.array(convertJsonSchemaToZod(schema.items));
    }

    default: {
      return z.any();
    }
  }
}
