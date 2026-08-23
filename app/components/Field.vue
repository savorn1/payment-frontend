<template>
  <!-- hidden fields render nothing; their value just rides along in the model -->
  <UFormField
    v-if="field.type !== 'hidden'"
    :label="label"
    :name="field.name"
    :required="field.required"
    :help="field.hint"
  >
    <component :is="control" v-model="model" :field="field" />
  </UFormField>
</template>

<script setup lang="ts">
// Thin resolver, Backpack-style: each field type has its own component under
// components/fields/. This file only owns what every type shares — the
// UFormField wrapper (label, required marker, hint) and label auto-humanization.
import type { Component } from 'vue'
import type { FieldDef, FieldType } from '~/shared/types'
import FieldText from './fields/FieldText.vue'
import FieldEmail from './fields/FieldEmail.vue'
import FieldPassword from './fields/FieldPassword.vue'
import FieldUrl from './fields/FieldUrl.vue'
import FieldNumber from './fields/FieldNumber.vue'
import FieldCurrency from './fields/FieldCurrency.vue'
import FieldTextarea from './fields/FieldTextarea.vue'
import FieldSelect from './fields/FieldSelect.vue'
import FieldRadio from './fields/FieldRadio.vue'
import FieldCheckbox from './fields/FieldCheckbox.vue'
import FieldSwitch from './fields/FieldSwitch.vue'
import FieldDate from './fields/FieldDate.vue'
import FieldDateTime from './fields/FieldDateTime.vue'

const props = defineProps<{ field: FieldDef }>()

const model = defineModel<unknown>()

const CONTROLS: Record<Exclude<FieldType, 'hidden'>, Component> = {
  text: FieldText,
  email: FieldEmail,
  password: FieldPassword,
  url: FieldUrl,
  number: FieldNumber,
  currency: FieldCurrency,
  textarea: FieldTextarea,
  select: FieldSelect,
  radio: FieldRadio,
  checkbox: FieldCheckbox,
  switch: FieldSwitch,
  date: FieldDate,
  datetime: FieldDateTime
}

const control = computed(
  () => CONTROLS[(props.field.type ?? 'text') as Exclude<FieldType, 'hidden'>]
)

// Label is optional and constructed from the name — 'dateOfBirth' /
// 'date_of_birth' both become 'Date of birth'.
const label = computed(() => props.field.label ?? humanize(props.field.name))
</script>
