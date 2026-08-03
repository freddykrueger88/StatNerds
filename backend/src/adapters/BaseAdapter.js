'use strict';

/**
 * BaseAdapter – Interface für alle Liga-Adapter.
 * Jeder Adapter muss diese Methoden implementieren.
 */
class BaseAdapter {
  constructor(apiClient) {
    if (new.target === BaseAdapter) {
      throw new Error('BaseAdapter ist abstrakt und kann nicht direkt instanziiert werden.');
    }
    this.client = apiClient;
  }

  /** Liefert alle laufenden Spiele. @returns {Promise<object[]>} */
  async getLive() { throw new Error('getLive() muss implementiert werden.'); }

  /** Liefert Spielplan. @param {string} [round] @returns {Promise<object[]>} */
  async getSchedule(round) { throw new Error('getSchedule() muss implementiert werden.'); }

  /** Liefert Statistiken zu einem Spiel. @param {string|number} fixtureId @returns {Promise<object>} */
  async getFixtureStats(fixtureId) { throw new Error('getFixtureStats() muss implementiert werden.'); }

  /** Liefert Basis-Infos zu einem Spiel. @param {string|number} fixtureId @returns {Promise<object>} */
  async getFixture(fixtureId) { throw new Error('getFixture() muss implementiert werden.'); }
}

module.exports = BaseAdapter;
