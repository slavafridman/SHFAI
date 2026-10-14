import { Body, Controller, Header, HttpCode, HttpException, Post, Query, UseFilters } from '@nestjs/common';
import { STUB_MARKER, stubProblem, StubProblemFilter } from './stub-http.js';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function claim(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 128
    && Array.from(value).every(character => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    });
}

@Controller('api/v1/auth')
@UseFilters(StubProblemFilter)
export class StubSsoSimulationController {
  @Post('sso-simulation')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Header('X-SHF-Data-Source', 'synthetic-stub')
  simulate(@Body() body: unknown, @Query() query: Record<string, unknown>) {
    if (Object.keys(query).length !== 0 || !record(body)
      || Object.keys(body).length !== 2 || Object.keys(body).some(key => key !== 'user' && key !== 'domain_user')
      || !claim(body['user']) || !claim(body['domain_user'])) {
      throw new HttpException(stubProblem(400, 'INVALID_SSO_SIMULATION',
        'יש לשלוח רק user ו־domain_user כמחרוזות לא ריקות, עד 128 תווים וללא תווי בקרה. הבדיקה אינה הזדהות.'), 400);
    }
    return {
      ...STUB_MARKER,
      simulationOnly: true,
      claimsAccepted: true,
      identityAssurance: 'unverified',
      sessionCreated: false,
      permissions: [],
      oracleAccess: false,
      nemoContacted: false,
      nextStep: 'VERIFIED_SSO_REQUIRED',
      fetchedAt: new Date().toISOString(),
    };
  }
}
