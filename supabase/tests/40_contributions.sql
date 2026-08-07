\pset pager off
-- Chaque insertion ci-dessous DOIT etre refusee par le trigger de validation.
-- Rejoue apres toute modification de valider_contribution().

CREATE TEMP TABLE res(test TEXT, verdict TEXT, detail TEXT);

DO $$
DECLARE d TEXT;
BEGIN
  BEGIN INSERT INTO contributions (type, data) VALUES ('card',
      jsonb_build_object('set_name', repeat('x',9000),'lang','FR','card_number','1/1','year','2000'));
    INSERT INTO res VALUES ('payload > 8 Ko','KO ACCEPTE',NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS d = MESSAGE_TEXT;
    INSERT INTO res VALUES ('payload > 8 Ko','OK refuse',d); END;

  BEGIN INSERT INTO contributions (type, data) VALUES ('card',
      '{"set_name":"T","lang":"FR","card_number":"9/9","year":"2000","website":"http://spam"}'::jsonb);
    INSERT INTO res VALUES ('pot de miel','KO ACCEPTE',NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS d = MESSAGE_TEXT;
    INSERT INTO res VALUES ('pot de miel','OK refuse',d); END;

  BEGIN INSERT INTO contributions (type, data) VALUES ('card','{"set_name":"T"}'::jsonb);
    INSERT INTO res VALUES ('champs obligatoires','KO ACCEPTE',NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS d = MESSAGE_TEXT;
    INSERT INTO res VALUES ('champs obligatoires','OK refuse',d); END;

  BEGIN INSERT INTO contributions (type, data) VALUES ('card',
      '{"set_name":"T","lang":"FR","card_number":"8/8","year":"1850"}'::jsonb);
    INSERT INTO res VALUES ('annee aberrante','KO ACCEPTE',NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS d = MESSAGE_TEXT;
    INSERT INTO res VALUES ('annee aberrante','OK refuse',d); END;

  BEGIN INSERT INTO contributions (type, data) VALUES ('card',
      '{"set_name":"T","lang":"FR","card_number":"7/7","year":"2000","scan_url":"https://evil.example.com/x.jpg"}'::jsonb);
    INSERT INTO res VALUES ('scan_url externe','KO ACCEPTE',NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS d = MESSAGE_TEXT;
    INSERT INTO res VALUES ('scan_url externe','OK refuse',d); END;

  BEGIN INSERT INTO contributions (type, contributor_email, data)
      VALUES ('item','pas-un-email','{"item_type":"carte"}'::jsonb);
    INSERT INTO res VALUES ('email invalide','KO ACCEPTE',NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS d = MESSAGE_TEXT;
    INSERT INTO res VALUES ('email invalide','OK refuse',d); END;

  -- Une contribution valide doit passer, son doublon immediat non.
  BEGIN INSERT INTO contributions (type, data) VALUES ('card',
      '{"set_name":"Zzz Test","lang":"FR","card_number":"1/1","year":"1999","variant":"Normale"}'::jsonb);
    INSERT INTO res VALUES ('contribution legitime','OK acceptee',NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS d = MESSAGE_TEXT;
    INSERT INTO res VALUES ('contribution legitime','KO REFUSEE A TORT',d); END;

  BEGIN INSERT INTO contributions (type, data) VALUES ('card',
      '{"set_name":"Zzz Test","lang":"FR","card_number":"1/1","year":"1999","variant":"Normale"}'::jsonb);
    INSERT INTO res VALUES ('doublon dans l heure','KO ACCEPTE',NULL);
  EXCEPTION WHEN OTHERS THEN GET STACKED DIAGNOSTICS d = MESSAGE_TEXT;
    INSERT INTO res VALUES ('doublon dans l heure','OK refuse',d); END;
END $$;

SELECT * FROM res;
DELETE FROM contributions WHERE data->>'set_name' = 'Zzz Test';
