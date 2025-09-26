const express = require('express');
const applicationsController = require('../controllers/applicationsController');

const router = express.Router();

/**
 * @route   POST /api/applications
 * @desc    Crear una nueva postulación a una beca
 * @access  Public
 * @body    {
 *   scholarshipId: ObjectId,
 *   
 *   // Datos personales
 *   docType: 'cedula' | 'pasaporte' | 'cedula_extranjeria' | 'tarjeta_identidad',
 *   docNumber: string,
 *   firstName: string,
 *   lastName: string,
 *   nationality: string,
 *   gender: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir',
 *   birthDate: Date,
 *   maritalStatus: 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo',
 *   birthCity: string,
 *   residenceCity: string,
 *   email: string,
 *   phone: string,
 *   hasDisability: boolean,
 *   disabilityDetail?: string,
 *   isIndigenous: boolean,
 *   indigenousDetail?: string,
 *   
 *   // Datos académicos
 *   university: string,
 *   universityType: 'publica' | 'privada' | 'internacional',
 *   major: string,
 *   academicStatus: 'estudiante' | 'graduado' | 'egresado' | 'cursando',
 *   level: 'pregrado' | 'posgrado' | 'maestria' | 'doctorado' | 'tecnico' | 'diplomado',
 *   campusCity: string,
 *   gpa: number (0.0-5.0),
 *   ranking?: number,
 *   credits: number,
 *   entryYear: number,
 *   graduationYear?: number,
 *   
 *   // Motivación
 *   sourceInfo: 'redes_sociales' | 'sitio_web_universidad' | 'recomendacion_amigo' | 
 *              'email_institucional' | 'periodico' | 'evento' | 'otro',
 *   motivation: string (100-2000 chars),
 *   links?: {
 *     linkedin?: string,
 *     portfolio?: string
 *   },
 *   
 *   // Consentimientos (obligatorios)
 *   acceptRequirements: 'true',
 *   commitToProcess: 'true',
 *   acceptPrivacy: 'true'
 * }
 * @headers {
 *   x-utm-source?: string,
 *   x-utm-medium?: string,
 *   x-utm-campaign?: string,
 *   x-utm-term?: string,
 *   x-utm-content?: string
 * }
 * @query   {
 *   utm_source?: string,
 *   utm_medium?: string,
 *   utm_campaign?: string,
 *   utm_term?: string,
 *   utm_content?: string
 * }
 * @returns {
 *   applicationId: ObjectId,
 *   status: 'submitted',
 *   submittedAt: Date,
 *   scholarshipTitle: string
 * }
 * @validations {
 *   - Beca existe y está publicada
 *   - Fechas de postulación válidas (openAt <= now <= closeAt)
 *   - Anti-duplicado por (scholarshipId, docType, docNumber)
 *   - Consentimientos obligatorios aceptados
 *   - Validaciones de edad (16-100 años)
 *   - Formatos de email, teléfono, URLs
 *   - Detalles obligatorios si hasDisability o isIndigenous
 *   - Año graduación >= año ingreso
 * }
 */
router.post('/', applicationsController.createApplication);

module.exports = router;
