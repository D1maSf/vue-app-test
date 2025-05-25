<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';

const authStore = useAuthStore();
const router = useRouter();

// Проверяем авторизацию при монтировании компонента
onMounted(async () => {
    if (authStore.user) {
        router.push('/');
    }
});

const isLogin = ref(true);
const username = ref('');
const password = ref('');
const error = ref(null);
const success = ref(null);
const coincidence = ref(null);
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const recaptchaLoaded = ref(false);
const recaptchaWidgetId = ref(null);
const usernameErrors = ref([]); // Для хранения сообщений об ошибках
let errorTimeout = null; // Таймер для error
let usernameTimeout = null; // Таймер для usernameErrors

// Правила валидации
const usernameRules = [
  v => !!v || 'Не хватает у вас мощи)))',
  v => (v.length >= 3 && v.length <= 15) || 'Имя должно быть от 3 до 15 символов и содержать буквы латинского или кириллического алфавита',
  v => /^[a-zA-Zа-яА-Я]+$/.test(v) || 'Только буквы (латиница или кириллица)',
];

// Проверка валидности имени для активации кнопки
const isUsernameValid = computed(() => {
  return username.value.length >= 3 && username.value.length <= 15 && /^[a-zA-Zа-яА-Я]+$/.test(username.value);
});

// Универсальная функция для установки сообщений с автоочисткой
const setMessage = (target, message, timeout = 3000) => {
  const currentTimeout = target === error ? errorTimeout : usernameTimeout;
  if (currentTimeout) {
    clearTimeout(currentTimeout);
  }
  target.value = message;
  const newTimeout = setTimeout(() => {
    target.value = Array.isArray(message) ? [] : null; // Очищаем как массив или null
    if (target === error) errorTimeout = null;
    else usernameTimeout = null;
  }, timeout);
  if (target === error) errorTimeout = newTimeout;
  else usernameTimeout = newTimeout;
};

// Фильтрация и валидация ввода
const validateUsername = () => {
  username.value = username.value
      .replace(/[^a-zA-Zа-яА-Я]/g, '')
      .slice(0, 15);

  // Проверяем правила и показываем ошибки
  const errors = [];
  usernameRules.forEach(rule => {
    const result = rule(username.value);
    if (typeof result === 'string') {
      errors.push(result);
    }
  });

  if (errors.length > 0) {
    setMessage(usernameErrors, errors);
  } else {
    usernameErrors.value = [];
  }
};

// Функция загрузки reCAPTCHA
const loadRecaptcha = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.grecaptcha.ready(() => {
        console.log('reCAPTCHA загружена');
        recaptchaLoaded.value = true;
        resolve();
      });
    };
    script.onerror = () => reject(new Error('Ошибка загрузки reCAPTCHA'));
    document.head.appendChild(script);
  });
};

// Инициализация виджета reCAPTCHA
const renderRecaptcha = () => {
  if (!recaptchaSiteKey) {
    error.value = 'Ошибка: Не указан ключ reCAPTCHA (VITE_RECAPTCHA_SITE_KEY)';
    return;
  }

  if (recaptchaLoaded.value && !recaptchaWidgetId.value) {
    try {
      recaptchaWidgetId.value = window.grecaptcha.render('recaptcha-container', {
        sitekey: recaptchaSiteKey,
        theme: 'light',
      });
      console.log('reCAPTCHA отрендерена, widgetId:', recaptchaWidgetId.value);
    } catch (err) {
      console.error('Ошибка рендеринга reCAPTCHA:', err);
      error.value = 'Ошибка инициализации reCAPTCHA';
    }
  }
};

// Сброс reCAPTCHA
const resetRecaptcha = () => {
  if (recaptchaLoaded.value && recaptchaWidgetId.value !== null) {
    window.grecaptcha.reset(recaptchaWidgetId.value);
    console.log('reCAPTCHA сброшена');
  }
};

const submit = async () => {
  error.value = null;
  success.value = null;
  coincidence.value = null;

  // Проверка на пустые поля
  if (!username.value || !password.value) {
    setMessage(error,'Введите логин и пароль');
    return;
  }

  try {
    if (isLogin.value) {
      // Вход
      await authStore.login(username.value, password.value);
      router.push('/');
    } else {
      //проверка логина на валидность
      if (!isUsernameValid.value) {
        error.value = 'Имя пользователя должно быть от 3 до 15 букв (латиница или кириллица)';
        return;
      }
      // Проверка существования пользователя
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/check-username`, { username: username.value });
        if (response.data.exists) {
          setMessage(coincidence, 'Такой пользователь уже существует');
          return;
        }
      } catch (err) {
        console.error('Ошибка проверки существования пользователя:', err);
        setMessage(error, 'Ошибка проверки существования пользователя');
        return;
      }

      // Регистрация с reCAPTCHA
      if (!recaptchaLoaded.value) {
        error.value = 'reCAPTCHA ещё не загрузилась, подождите';
        return;
      }

      if (recaptchaWidgetId.value === null) {
        error.value = 'reCAPTCHA не инициализирована';
        console.log('recaptchaWidgetId в submit:', recaptchaWidgetId.value);
        return;
      }

      const recaptchaResponse = window.grecaptcha.getResponse(recaptchaWidgetId.value);
      if (!recaptchaResponse) {
        error.value = 'Пожалуйста, подтвердите, что вы не робот';
        return;
      }

      await authStore.register(username.value, password.value, recaptchaResponse);
      isLogin.value = true;
      success.value = 'Регистрация успешна, добро пожаловать!';
      resetRecaptcha(); // Сбрасываем капчу после успешной регистрации
      router.push('/'); // Редирект на главную после регистрации
    }
  } catch (err) {
    error.value = authStore.error || 'Ошибка';
    console.error('Ошибка в submit:', err);
  } finally {
    if (!isLogin.value) {
      resetRecaptcha(); // Сбрасываем капчу, если остались на регистрации
    }
  }
};

const toggleForm = async () => {
  const wasLogin = isLogin.value;
  isLogin.value = !isLogin.value;
  error.value = null;
  coincidence.value = null;
  success.value = null;
  username.value = '';
  password.value = '';

  if (!isLogin.value) {
    // Переключились на регистрацию
    if (!recaptchaLoaded.value) {
      try {
        await loadRecaptcha();
        renderRecaptcha();
      } catch (err) {
        console.error(err);
        error.value = 'Ошибка загрузки reCAPTCHA';
      }
    } else {
      resetRecaptcha(); // Сбрасываем капчу для новой попытки
    }
  } else if (!wasLogin && recaptchaLoaded.value && recaptchaWidgetId.value !== null) {
    // Переключились на вход
    resetRecaptcha();
  }
};
</script>

<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="9" lg="6">
        <v-card class="pa-4">
            <h2 class="mb-4 text-center">
              {{ isLogin ? 'Вход' : 'Регистрация' }}
            </h2>
          <v-card-text>
            <v-form class="form-auth" @submit.prevent="submit">
              <v-text-field
                v-model="username"
                label="Имя пользователя"
                required
                :error-messages="usernameErrors"
                @input="validateUsername"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Пароль"
                type="password"
                required
              ></v-text-field>

              <!-- reCAPTCHA только для регистрации, но остаётся в DOM -->
              <div v-show="!isLogin" id="recaptcha-container" class="g-recaptcha"></div>

              <v-btn
                class="btn btn--default h-auto"
                type="submit"
                block
                :loading="authStore.loading"

              >
                {{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
              </v-btn>

              <v-btn h-0
                text
                block
                @click="toggleForm"
                class="btn btn--light mt-2 h-auto"
                elevation="24"
              >
                {{ isLogin ? 'Регистрация' : 'Вход' }}
              </v-btn>

              <v-alert v-if="error" type="error" class="mt-2">
                {{ error }}
              </v-alert>
              <v-alert v-if="success" type="success" class="mt-2">
                {{ success }}
              </v-alert>
              <v-alert v-if="coincidence" type="warning" class="mt-2">
                {{ coincidence }}
              </v-alert>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
.auth {
  background-image: linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("/image/idP5t3FQc5ntEzcbl6yg--0--ya9qu.webp");
  background-position: center;
  background-size: cover;
}

.form-auth {
  @media #{$min-lg} {
    display: flex;
    flex-direction: column;
    gap: 26px;
  }
}

.g-recaptcha {
  margin: 20px 0;

  @media #{$xs} {
    margin: 10px 0;
    transform: scale(0.77); // Уменьшаем до 77% от оригинала
    transform-origin: 0 0;
  }
}
</style>