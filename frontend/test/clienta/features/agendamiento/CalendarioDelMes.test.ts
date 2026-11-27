// Pruebas unitarias del calendario de reservas. Usa objetos reales del
// dominio (plazo y horario), sin red ni reloj, asi que no necesita dobles.
// Cada prueba sigue Preparar (Arrange) / Ejecutar (Act) / Comprobar (Assert).

import { describe, expect, it } from 'vitest'
import {
  CalendarioDelMes,
  type DiaDelCalendario,
} from '../../../../src/clienta/features/agendamiento/CalendarioDelMes.ts'
import { PlazoDeReserva } from '../../../../src/clienta/features/agendamiento/PlazoDeReserva.ts'
import { HorarioDeAtencion } from '../../../../src/clienta/features/salon/HorarioDeAtencion.ts'

// Hoy es jueves 26 de noviembre de 2026 y se puede agendar hasta el 31 de
// diciembre. El salon abre de lunes a sabado; el domingo esta cerrado.
const HOY = '2026-11-26'
const plazo = new PlazoDeReserva(HOY, '2026-12-31', 24)
const horario = HorarioDeAtencion.desdeDTO(
  [1, 2, 3, 4, 5, 6].map((diaSemana) => ({ diaSemana, apertura: '09:00', cierre: '18:00' })),
)

function calendarioDe(fechaDelMes: string): CalendarioDelMes {
  return new CalendarioDelMes(fechaDelMes, plazo, horario)
}

function buscarDia(calendario: CalendarioDelMes, fecha: string): DiaDelCalendario {
  const dia = calendario.semanas().flat().find((candidato) => candidato.fecha === fecha)
  if (!dia) throw new Error(`El calendario no muestra el ${fecha}`)
  return dia
}

describe('CalendarioDelMes', () => {
  describe('semanas', () => {
    it('empieza el mes en su primer dia aunque se cree con cualquier fecha', () => {
      expect(calendarioDe(HOY).inicio).toBe('2026-11-01')
    })

    it('cubre el mes con semanas completas de lunes a domingo', () => {
      // Act
      const semanas = calendarioDe(HOY).semanas()

      // Assert: noviembre de 2026 empieza en domingo y termina en lunes.
      expect(semanas).toHaveLength(6)
      expect(semanas.every((semana) => semana.length === 7)).toBe(true)
      expect(semanas[0][0].fecha).toBe('2026-10-26')
      expect(semanas[5][6].fecha).toBe('2026-12-06')
    })

    it('marca los dias de relleno que son de otro mes', () => {
      // Arrange
      const noviembre = calendarioDe(HOY)

      // Act y Assert
      expect(buscarDia(noviembre, '2026-10-31').delMes).toBe(false)
      expect(buscarDia(noviembre, '2026-11-01').delMes).toBe(true)
    })
  })

  describe('dias disponibles', () => {
    it('hoy se puede elegir y se marca como hoy', () => {
      // Act
      const hoy = buscarDia(calendarioDe(HOY), HOY)

      // Assert
      expect(hoy.esHoy).toBe(true)
      expect(hoy.noDisponible).toBeNull()
    })

    it('los dias anteriores a hoy no se pueden elegir', () => {
      expect(buscarDia(calendarioDe(HOY), '2026-11-25').noDisponible).toBe('pasado')
    })

    it('los dias que el salon no abre no se pueden elegir', () => {
      // 29 de noviembre de 2026 es domingo.
      expect(buscarDia(calendarioDe(HOY), '2026-11-29').noDisponible).toBe('cerrado')
    })

    it('los dias despues del plazo de la duena no se pueden elegir', () => {
      // Arrange
      const diciembre = calendarioDe('2026-12-01')

      // Act y Assert: el 31 es el ultimo dia del plazo; el 1 de enero ya no.
      expect(buscarDia(diciembre, '2026-12-31').noDisponible).toBeNull()
      expect(buscarDia(diciembre, '2027-01-01').noDisponible).toBe('fuera-de-plazo')
    })
  })

  describe('navegacion entre meses', () => {
    it('no deja volver a un mes que ya paso', () => {
      // Arrange
      const noviembre = calendarioDe(HOY)

      // Act y Assert
      expect(noviembre.hayMesAnterior()).toBe(false)
      expect(noviembre.hayMesSiguiente()).toBe(true)
    })

    it('no deja avanzar a un mes fuera del plazo', () => {
      // Act
      const diciembre = calendarioDe(HOY).mesSiguiente()

      // Assert
      expect(diciembre.inicio).toBe('2026-12-01')
      expect(diciembre.hayMesSiguiente()).toBe(false)
      expect(diciembre.hayMesAnterior()).toBe(true)
    })

    it('al volver al mes anterior regresa al mismo mes', () => {
      expect(calendarioDe(HOY).mesSiguiente().mesAnterior().inicio).toBe('2026-11-01')
    })
  })
})
