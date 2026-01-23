import type { SkillSchema, IntentResult, ParameterExtractionResult } from "../types.js";

/**
 * LLM 接口（兼容项目中的 QwenLLM）
 */
export interface LLMProvider {
  sendMessage(
    message: string,
    systemPrompt?: string,
    options?: {
      responseFormat?: { type: string };
      temperature?: number;
    },
  ): Promise<{ content: string; role: string }>;

  chat(messages: Array<{ role: string; content: string }>): Promise<{ content: string }>;
}

/**
 * NLU（自然语言理解）模块
 * 负责意图识别和参数提取
 */
export class NLU {
  constructor(private llm: LLMProvider) {}

  /**
   * 识别用户意图
   * @param userInput 用户输入
   * @param availableSkills 可用的技能列表
   * @returns 意图识别结果
   */
  async identifyIntent(userInput: string, availableSkills: SkillSchema[]): Promise<IntentResult> {
    const systemPrompt = this.buildIntentSystemPrompt(availableSkills);

    const prompt = `用户输入: "${userInput}"

请分析用户意图并返回 JSON 格式：
{
  "skillName": "技能名称",
  "confidence": 0.95,
  "reasoning": "选择该技能的理由"
}`;

    try {
      const response = await this.llm.sendMessage(prompt, systemPrompt, {
        responseFormat: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.content);

      // 验证技能是否存在
      const skill = availableSkills.find((s) => s.name === result.skillName);
      if (!skill) {
        throw new Error(`Unknown skill: ${result.skillName}`);
      }

      // 初步提取参数
      const extractedParams = await this.extractParameters(userInput, skill);

      return {
        skillName: result.skillName,
        confidence: result.confidence || 0.5,
        extractedParams: extractedParams.params,
      };
    } catch (error) {
      console.error("Intent identification failed:", error);
      throw new Error("无法识别用户意图，请更清晰地描述您的需求");
    }
  }

  /**
   * 提取参数
   * @param userInput 用户输入
   * @param skill 技能定义
   * @returns 参数提取结果
   */
  async extractParameters(
    userInput: string,
    skill: SkillSchema,
  ): Promise<ParameterExtractionResult> {
    const systemPrompt = this.buildParamExtractionSystemPrompt(skill);

    const prompt = `用户输入: "${userInput}"

从用户输入中提取参数，返回 JSON 格式：
{
  "params": {
    "参数名": "提取的值或null"
  },
  "reasoning": "提取理由"
}

注意：
1. 无法确定的参数设为 null
2. 严格按照参数类型返回值
3. 不要编造或猜测参数值`;

    try {
      const response = await this.llm.sendMessage(prompt, systemPrompt, {
        responseFormat: { type: "json_object" },
        temperature: 0.1, // 低温度确保精确提取
      });

      const result = JSON.parse(response.content);
      const params = result.params || {};

      // 验证和标准化参数
      const validatedParams = this.validateAndNormalizeParams(params, skill);

      // 找出缺失的必需参数
      const missingRequired = skill.parameters.required.filter(
        (param) =>
          validatedParams.params[param] === null || validatedParams.params[param] === undefined,
      );

      return {
        params: validatedParams.params,
        missingRequired,
        validationErrors: validatedParams.errors,
      };
    } catch (error) {
      console.error("Parameter extraction failed:", error);
      // 返回空参数
      return {
        params: {},
        missingRequired: skill.parameters.required,
        validationErrors: {},
      };
    }
  }

  /**
   * 从对话中提取单个参数
   * @param userInput 用户输入
   * @param paramName 参数名
   * @param paramSchema 参数 Schema
   * @returns 提取的参数值
   */
  async extractSingleParameter(
    userInput: string,
    paramName: string,
    paramSchema: any,
  ): Promise<any> {
    const systemPrompt = `你是一个参数提取助手。
用户正在回答关于参数 "${paramName}" 的问题。
参数描述: ${paramSchema.description}
参数类型: ${paramSchema.type}
${paramSchema.enum ? `可选值: ${paramSchema.enum.join(", ")}` : ""}

从用户输入中提取该参数的值，返回 JSON 格式：
{
  "value": "提取的值或null",
  "confidence": 0.95
}`;

    try {
      const response = await this.llm.sendMessage(userInput, systemPrompt, {
        responseFormat: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.content);
      return result.value !== null ? result.value : null;
    } catch (error) {
      console.error(`Failed to extract parameter ${paramName}:`, error);
      return null;
    }
  }

  /**
   * 构建意图识别的系统提示
   */
  private buildIntentSystemPrompt(skills: SkillSchema[]): string {
    const skillDescriptions = skills
      .map((skill) => `- ${skill.name}: ${skill.description}`)
      .join("\n");

    return `你是一个智能助手，负责识别用户意图并匹配对应的技能。

可用技能:
${skillDescriptions}

分析用户输入，选择最匹配的技能。考虑：
1. 用户的明确意图
2. 关键词匹配
3. 上下文理解

返回格式必须是有效的 JSON。`;
  }

  /**
   * 构建参数提取的系统提示
   */
  private buildParamExtractionSystemPrompt(skill: SkillSchema): string {
    const paramsDesc = Object.entries(skill.parameters.properties)
      .map(([name, schema]) => {
        const required = skill.parameters.required.includes(name) ? "【必需】" : "【可选】";
        return `- ${name} (${schema.type}) ${required}: ${schema.description}`;
      })
      .join("\n");

    return `你是一个参数提取助手。
技能: ${skill.name}
描述: ${skill.description}

需要提取的参数:
${paramsDesc}

从用户输入中准确提取参数值。规则：
1. 只提取明确给出的信息
2. 不要推测或编造
3. 无法确定的参数返回 null
4. 严格按照参数类型返回

返回格式必须是有效的 JSON。`;
  }

  /**
   * 验证和标准化参数
   */
  private validateAndNormalizeParams(
    params: Record<string, any>,
    skill: SkillSchema,
  ): { params: Record<string, any>; errors: Record<string, string> } {
    const validatedParams: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const [name, schema] of Object.entries(skill.parameters.properties)) {
      const value = params[name];

      if (value === null || value === undefined) {
        validatedParams[name] = null;
        continue;
      }

      try {
        // 类型转换和验证
        switch (schema.type) {
          case "string":
            validatedParams[name] = String(value);
            break;
          case "number":
            const num = Number(value);
            if (isNaN(num)) {
              errors[name] = `${name} 必须是数字`;
              validatedParams[name] = null;
            } else {
              validatedParams[name] = num;
            }
            break;
          case "boolean":
            validatedParams[name] = Boolean(value);
            break;
          case "array":
            validatedParams[name] = Array.isArray(value) ? value : [value];
            break;
          default:
            validatedParams[name] = value;
        }

        // 枚举验证
        if (schema.enum && !schema.enum.includes(validatedParams[name])) {
          errors[name] = `${name} 必须是以下值之一: ${schema.enum.join(", ")}`;
          validatedParams[name] = null;
        }
      } catch (error) {
        errors[name] = `${name} 验证失败: ${error}`;
        validatedParams[name] = null;
      }
    }

    return { params: validatedParams, errors };
  }

  /**
   * 生成参数询问提示
   * @param paramName 参数名
   * @param paramSchema 参数 Schema
   * @param retryCount 重试次数
   * @returns 询问提示文本
   */
  generateParameterPrompt(paramName: string, paramSchema: any, retryCount: number = 0): string {
    let prompt = "";

    if (retryCount === 0) {
      prompt = `请提供 ${paramName}`;
      if (paramSchema.description) {
        prompt += `（${paramSchema.description}）`;
      }
    } else {
      prompt = `抱歉，我没有理解您提供的 ${paramName}，请重新输入`;
    }

    // 添加提示信息
    if (paramSchema.enum && paramSchema.enum.length > 0) {
      prompt += `\n可选值: ${paramSchema.enum.join(", ")}`;
    }

    if (paramSchema.format) {
      prompt += `\n格式: ${paramSchema.format}`;
    }

    if (paramSchema.default !== undefined) {
      prompt += `\n默认值: ${paramSchema.default}`;
    }

    return prompt;
  }
}
