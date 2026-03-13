/**
 * OBIX Forms - Validation, autocomplete, progressive enhancement
 * Comprehensive form management with advanced validation
 */
export function createFormEngine(config) {
    const fields = new Map(config.fields.map((field) => [field.name, { ...field }]));
    let validationTiming = "onSubmit";
    return {
        async validate(data) {
            const errors = {};
            const warnings = {};
            for (const field of fields.values()) {
                const value = data[field.name];
                if (field.required && (value === undefined || value === null || value === "")) {
                    errors[field.name] = [...(errors[field.name] ?? []), "This field is required."];
                }
                for (const rule of field.validationRules) {
                    const isValid = await rule.validate(value);
                    if (!isValid) {
                        errors[field.name] = [...(errors[field.name] ?? []), rule.message];
                    }
                }
                if (field.required && !field.autocomplete) {
                    warnings[field.name] = [...(warnings[field.name] ?? []), "Missing autocomplete attribute for required field."];
                }
            }
            return {
                valid: Object.keys(errors).length === 0,
                errors,
                warnings
            };
        },
        getField(name) {
            return fields.get(name);
        },
        async submit(data) {
            const result = await this.validate(data);
            if (!result.valid) {
                throw new Error("Form validation failed.");
            }
            await config.submitHandler?.(data);
        },
        enableAutocomplete(fieldName, type) {
            const field = fields.get(fieldName);
            if (!field) {
                throw new Error(`Field '${fieldName}' not found.`);
            }
            field.autocomplete = type;
        },
        setValidationTiming(timing) {
            validationTiming = timing;
        },
        getValidationTiming() {
            return validationTiming;
        },
        shouldValidateOn(event) {
            if (validationTiming === "onChange") {
                return event === "change";
            }
            if (validationTiming === "onBlur") {
                return event === "blur";
            }
            return event === "submit";
        }
    };
}
//# sourceMappingURL=index.js.map