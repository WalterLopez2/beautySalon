// Pruebas unitarias del horario publico. Son objetos de dominio puros: no
// hay red, ni reloj, ni React, asi que no hace falta ningun doble de prueba.
// Cada prueba sigue Preparar (Arrange) / Ejecutar (Act) / Comprobar (Assert).

import { describe, expect, it } from 'vitest'
import { HorarioDeAtencion } from '../../../../src/clienta/features/salon/HorarioDeAtencion.ts'

// De lunes a viernes de 9 a 6, sabado de 8 a 1 y el domingo cerrado.
const horarioDelSalon = HorarioDeAtencion.desdeDTO([
  ...[1, 2, 3, 4, 5].map((diaSemana) => ({ diaSemana, apertura: '09:00', cierre: '18:00' })),
  { diaSemana: 6, apertura: '08:00', cierre: '13:00' },
])
const sinHorario = HorarioDeAtencion.desdeDTO([])

// Fechas de referencia (noviembre de 2026).
const JUEVES = '2026-11-26'
const VIERNES = '2026-11-27'
const SABADO = '2026-11-28'
const DOMINGO = '2026-11-29'
const LUNES = '2026-11-30'

describe('HorarioDeAtencion', () => {
  describe('semana', () => {
    it('muestra los siete dias de lunes a domingo, con los dias sin horas como cerrados', () => {
      // Act
      const semana = horarioDelSalon.semana()

      // Assert
      expect(semana.map(({ dia }) => dia.nombre)).toEqual([
        'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo',
      ])
      expect(semana[0].horas).toEqual({ apertura: '09:00', cierre: '18:00' })
      expect(semana[6].horas).toBeNull()
    })

    it('esta vacio solo cuando la duena no configuro ningun dia', () => {
      expect(sinHorario.estaVacio()).toBe(true)
      expect(horarioDelSalon.estaVacio()).toBe(false)
    })
  })

  describe('abreEl', () => {
    it('abre los dias que tienen horas y no el domingo', () => {
      expect(horarioDelSalon.abreEl(LUNES)).toBe(true)
      expect(horarioDelSalon.abreEl(DOMINGO)).toBe(false)
    })
  })

  describe('estadoEn', () => {
    it('dentro del horario esta abierto y dice a que hora cierra', () => {
      // Act
      const estado = horarioDelSalon.estadoEn(JUEVES, '12:00')

      // Assert
      expect(estado).toEqual({ abierto: true, cierre: '18:00' })
    })

    it('antes de abrir avisa que abre hoy mas tarde', () => {
      // Act
      const estado = horarioDelSalon.estadoEn(JUEVES, '07:30')

      // Assert
      expect(estado).toEqual({ abierto: false, proximaApertura: { fecha: JUEVES, hora: '09:00' } })
    })

    it('a la hora exacta de cierre ya esta cerrado y abre el dia siguiente', () => {
      // Act
      const estado = horarioDelSalon.estadoEn(JUEVES, '18:00')

      // Assert
      expect(estado).toEqual({ abierto: false, proximaApertura: { fecha: VIERNES, hora: '09:00' } })
    })

    it('se salta los dias cerrados para buscar la proxima apertura', () => {
      // Act: sabado despues del cierre; el domingo no abre.
      const estado = horarioDelSalon.estadoEn(SABADO, '14:00')

      // Assert
      expect(estado).toEqual({ abierto: false, proximaApertura: { fecha: LUNES, hora: '09:00' } })
    })

    it('sin horario no hay proxima apertura que mostrar', () => {
      // Act
      const estado = sinHorario.estadoEn(JUEVES, '12:00')

      // Assert
      expect(estado).toEqual({ abierto: false, proximaApertura: null })
    })
  })
})
