import { describe, it, expect } from 'vitest';
import { createFormEngine } from '../src/index.js';

describe('obix-forms integration', () => {
  it('supports validation timing modes and autocomplete enforcement warnings', async () => {
    const engine = createFormEngine({
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
          validationRules: [
            {
              name: 'has-at',
              validate: (value) => typeof value === 'string' && value.includes('@'),
              message: 'Email must include @'
            }
          ]
        }
      ]
    });

    engine.setValidationTiming('onBlur');
    expect(engine.getValidationTiming()).toBe('onBlur');
    expect(engine.shouldValidateOn('blur')).toBe(true);
    expect(engine.shouldValidateOn('submit')).toBe(false);

    const result = await engine.validate({ email: 'invalid' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toContain('Email must include @');
    expect(result.warnings?.email).toContain('Missing autocomplete attribute for required field.');

    engine.enableAutocomplete('email', 'email');
    const updatedField = engine.getField('email');
    expect(updatedField?.autocomplete).toBe('email');
  });
});
