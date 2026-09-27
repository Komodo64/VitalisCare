const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const AuthRules = {
  validarRegistro(dto, usuariosExistentes = []) {
    if (!dto.nombreCompleto || !dto.nombreCompleto.trim()) {
      throw new Error('El nombre completo es obligatorio.');
    }
    if (!dto.email || !dto.email.trim()) {
      throw new Error('El correo electrónico es obligatorio.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email.trim())) {
      throw new Error('El formato del correo electrónico es inválido.');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }
    const duplicado = usuariosExistentes.some(u => u.email.toLowerCase() === dto.email.trim().toLowerCase());
    if (duplicado) {
      throw new Error('Ya existe una cuenta con este correo electrónico.');
    }
    return true;
  }
};

describe('Validaciones de Autenticación y Registro (UsuarioService)', () => {

  test('validarRegistro: rechaza si el nombre está vacío', () => {
    assert.throws(
      () => AuthRules.validarRegistro({ nombreCompleto: '', email: 'test@test.com', password: 'password123' }),
      { message: 'El nombre completo es obligatorio.' }
    );
  });

  test('validarRegistro: rechaza si el formato de correo es incorrecto', () => {
    assert.throws(
      () => AuthRules.validarRegistro({ nombreCompleto: 'Juan', email: 'correo-invalido', password: 'password123' }),
      { message: 'El formato del correo electrónico es inválido.' }
    );
  });

  test('validarRegistro: rechaza contraseñas demasiado cortas (< 6 caracteres)', () => {
    assert.throws(
      () => AuthRules.validarRegistro({ nombreCompleto: 'Juan', email: 'juan@citas.local', password: '123' }),
      { message: 'La contraseña debe tener al menos 6 caracteres.' }
    );
  });

  test('validarRegistro: rechaza correos duplicados sin importar mayúsculas', () => {
    const existentes = [{ email: 'maria@citas.local' }];
    assert.throws(
      () => AuthRules.validarRegistro({ nombreCompleto: 'María', email: 'MARIA@CITAS.LOCAL', password: 'password123' }, existentes),
      { message: 'Ya existe una cuenta con este correo electrónico.' }
    );
  });

  test('validarRegistro: acepta un payload correcto y válido', () => {
    const existentes = [{ email: 'otro@citas.local' }];
    const valido = AuthRules.validarRegistro(
      { nombreCompleto: 'Carlos Ruiz', email: 'carlos.nuevo@citas.local', password: 'passwordSeguro123!' },
      existentes
    );
    assert.equal(valido, true);
  });
});
