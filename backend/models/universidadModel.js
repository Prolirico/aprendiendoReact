const pool = require('../config/db');

class Universidad {
    /**
     * Creates a new university in the database.
     * @param {object} universityData - The data for the new university.
     * @param {string} universityData.name - The name of the university.
     * @param {string} universityData.country - The country of the university.
     * @param {string[]} universityData.web_pages - An array of website URLs.
     * @param {string} universityData.alpha_two_code - The two-letter country code.
     * @param {string} [universityData.logo_path] - The path to the university's logo.
     * @returns {Promise<object>} The newly created university object.
     */
    static async create({ name, country, web_pages, alpha_two_code, logo_path }) {
        const [result] = await pool.execute(
            'INSERT INTO universidad (name, country, web_pages, alpha_two_code, logo_path) VALUES (?, ?, ?, ?, ?)',
            [name, country, JSON.stringify(web_pages), alpha_two_code, logo_path]
        );
        return { id_universidad: result.insertId, name, country, web_pages, alpha_two_code, logo_path };
    }

    /**
     * Finds all universities with optional search and pagination.
     * @param {object} options - The options for finding universities.
     * @param {string} [options.searchTerm=''] - The term to search for in name and country.
     * @param {number} [options.page=1] - The current page for pagination.
     * @param {number} [options.limit=10] - The number of items per page.
     * @returns {Promise<object>} An object containing the list of universities and pagination info.
     */
    static async findAll({ searchTerm = '', page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;
        const searchTermWildcard = `%${searchTerm}%`;

        const [rows] = await pool.execute(
            `SELECT * FROM universidad WHERE name LIKE ? OR country LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?`,
            [searchTermWildcard, searchTermWildcard, limit, offset]
        );

        const [[{ total }]] = await pool.execute(
            `SELECT COUNT(*) as total FROM universidad WHERE name LIKE ? OR country LIKE ?`,
            [searchTermWildcard, searchTermWildcard]
        );

        return {
            universities: rows.map(u => ({...u, web_pages: JSON.parse(u.web_pages || '[]')})),
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Finds a single university by its ID.
     * @param {number} id - The ID of the university.
     * @returns {Promise<object|null>} The university object or null if not found.
     */
    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM universidad WHERE id_universidad = ?', [id]);
        if (rows.length > 0) {
            const university = rows[0];
            return {...university, web_pages: JSON.parse(university.web_pages || '[]')};
        }
        return null;
    }

    /**
     * Updates a university's data.
     * @param {number} id - The ID of the university to update.
     * @param {object} universityData - The new data for the university.
     * @returns {Promise<object>} The result of the update operation.
     */
    static async update(id, universityData) {
        const fields = Object.keys(universityData);
        if (fields.length === 0) {
            return { affectedRows: 0 };
        }

        const valuePlaceholders = fields.map(field => `${field} = ?`).join(', ');

        // Ensure web_pages is stringified if present
        if (universityData.web_pages) {
            universityData.web_pages = JSON.stringify(universityData.web_pages);
        }

        const values = [...Object.values(universityData), id];

        const sql = `UPDATE universidad SET ${valuePlaceholders} WHERE id_universidad = ?`;

        const [result] = await pool.execute(sql, values);
        return result;
    }

    /**
     * Deletes a university by its ID.
     * @param {number} id - The ID of the university to delete.
     * @returns {Promise<object>} The result of the delete operation.
     */
    static async remove(id) {
        const [result] = await pool.execute('DELETE FROM universidad WHERE id_universidad = ?', [id]);
        return result;
    }
}

module.exports = Universidad;
